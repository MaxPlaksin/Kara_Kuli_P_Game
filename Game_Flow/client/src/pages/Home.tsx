import { useState, useCallback, useEffect, useRef } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MiniMap,
  addEdge,
  Connection,
  useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { initialNodes, initialEdges } from '@/lib/gameFlowData';
import { GameFlowNode } from '@/components/GameFlowNode';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Download, Upload, LayoutGrid, Eraser, Undo2, Redo2, User, Save } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const nodeTypes = { default: GameFlowNode };

const NODE_WIDTH = 220;
const NODE_HEIGHT = 80;
const GAP_X = 50;
const GAP_Y = 60;

/**
 * Раскладка узлов слоями по рёбрам, чтобы не налезали друг на друга. Затем можно вызвать fitView.
 */
function layoutNodes(nodes: Node[], edges: Edge[]): Node[] {
  if (nodes.length === 0) return nodes;
  const idToNode = new Map(nodes.map((n) => [n.id, n]));
  const inEdges = new Map<string, string[]>();
  const outEdges = new Map<string, string[]>();
  edges.forEach((e) => {
    if (!inEdges.has(e.target)) inEdges.set(e.target, []);
    inEdges.get(e.target)!.push(e.source);
    if (!outEdges.has(e.source)) outEdges.set(e.source, []);
    outEdges.get(e.source)!.push(e.target);
  });
  const layer = new Map<string, number>();
  function getLayer(id: string): number {
    if (layer.has(id)) return layer.get(id)!;
    const preds = inEdges.get(id) ?? [];
    const L = preds.length === 0 ? 0 : 1 + Math.max(...preds.map(getLayer));
    layer.set(id, L);
    return L;
  }
  nodes.forEach((n) => getLayer(n.id));
  const byLayer = new Map<number, Node[]>();
  nodes.forEach((n) => {
    const L = layer.get(n.id)!;
    if (!byLayer.has(L)) byLayer.set(L, []);
    byLayer.get(L)!.push(n);
  });
  const layers = Array.from(byLayer.keys()).sort((a, b) => a - b);
  const positioned = nodes.map((n) => ({ ...n }));
  layers.forEach((L) => {
    const layerNodes = byLayer.get(L)!.slice().sort((a, b) => a.id.localeCompare(b.id));
    const totalW = layerNodes.length * NODE_WIDTH + (layerNodes.length - 1) * GAP_X;
    const firstX = -totalW / 2 + NODE_WIDTH / 2;
    layerNodes.forEach((n, i) => {
      const idx = positioned.findIndex((p) => p.id === n.id);
      if (idx === -1) return;
      positioned[idx] = {
        ...positioned[idx],
        position: {
          x: firstX + i * (NODE_WIDTH + GAP_X),
          y: L * (NODE_HEIGHT + GAP_Y),
        },
      };
    });
  });
  return positioned;
}

/**
 * Главная страница с интерактивной блок-схемой игрового потока.
 * Палитра: простые приглушённые тона без неона.
 */
const SAVE_DELAY_MS = 400;

type NodeType = 'main-scene' | 'character-meeting' | 'choice';

const NODE_TYPE_STYLES: Record<
  NodeType,
  { border: string; color: string; boxShadow: string }
> = {
  'main-scene': {
    border: '2px solid #8b7aa8',
    color: '#5a4d66',
    boxShadow: '0 1px 3px rgba(139, 122, 168, 0.25)',
  },
  'character-meeting': {
    border: '2px solid #0d9488',
    color: '#0f766e',
    boxShadow: '0 1px 3px rgba(13, 148, 136, 0.25)',
  },
  choice: {
    border: '2px solid #059669',
    color: '#047857',
    boxShadow: '0 1px 3px rgba(5, 150, 105, 0.25)',
  },
};

const HISTORY_SIZE = 30;

function cloneState(nodes: Node[], edges: Edge[]) {
  return {
    nodes: JSON.parse(JSON.stringify(nodes)),
    edges: JSON.parse(JSON.stringify(edges)),
  };
}

export default function Home() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [addNodeOpen, setAddNodeOpen] = useState(false);
  const [newNodeLabel, setNewNodeLabel] = useState('');
  const [newNodeComment, setNewNodeComment] = useState('');
  const [newNodeType, setNewNodeType] = useState<NodeType>('main-scene');
  const [loadStatus, setLoadStatus] = useState<'idle' | 'loading' | 'loaded' | 'error'>('idle');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [remoteUpdateHint, setRemoteUpdateHint] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const skipNextSaveRef = useRef(false);
  const historyRef = useRef<{
    past: { nodes: Node[]; edges: Edge[] }[];
    future: { nodes: Node[]; edges: Edge[] }[];
  }>({ past: [], future: [] });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const selectedNodeRef = useRef<Node | null>(null);
  const { fitView, zoomOut } = useReactFlow();

  useEffect(() => {
    selectedNodeRef.current = selectedNode;
  }, [selectedNode]);

  const pushToHistory = useCallback(() => {
    const ref = historyRef.current;
    ref.past.push(cloneState(nodes, edges));
    if (ref.past.length > HISTORY_SIZE) ref.past.shift();
    ref.future = [];
    setCanUndo(ref.past.length > 0);
    setCanRedo(false);
  }, [nodes, edges]);

  const handleUndo = useCallback(() => {
    const ref = historyRef.current;
    if (ref.past.length === 0) return;
    const prev = ref.past.pop()!;
    ref.future.unshift(cloneState(nodes, edges));
    setNodes(prev.nodes);
    setEdges(prev.edges);
    setSelectedNode(null);
    skipNextSaveRef.current = true;
    setCanUndo(ref.past.length > 0);
    setCanRedo(true);
  }, [nodes, edges, setNodes, setEdges]);

  const handleRedo = useCallback(() => {
    const ref = historyRef.current;
    if (ref.future.length === 0) return;
    const next = ref.future.shift()!;
    ref.past.push(cloneState(nodes, edges));
    setNodes(next.nodes);
    setEdges(next.edges);
    setSelectedNode(null);
    skipNextSaveRef.current = true;
    setCanUndo(true);
    setCanRedo(ref.future.length > 0);
  }, [nodes, edges, setNodes, setEdges]);

  // Загрузка сохранённой схемы при старте
  useEffect(() => {
    setLoadStatus('loading');
    fetch('/api/flow')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.nodes && Array.isArray(data.nodes) && data?.edges && Array.isArray(data.edges)) {
          setNodes(data.nodes);
          setEdges(data.edges);
          skipNextSaveRef.current = true;
        }
        setLoadStatus('loaded');
      })
      .catch(() => setLoadStatus('error'));
  }, [setNodes, setEdges]);

  // WebSocket: получение изменений от других пользователей в реальном времени
  useEffect(() => {
    if (loadStatus !== 'loaded') return;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;
    let ws: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout>;

    const connect = () => {
      ws = new WebSocket(wsUrl);
      ws.onopen = () => setWsConnected(true);
      ws.onclose = () => {
        setWsConnected(false);
        reconnectTimer = setTimeout(connect, 3000);
      };
      ws.onerror = () => {};
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data as string);
          if (data?.type === 'flow' && Array.isArray(data.nodes) && Array.isArray(data.edges)) {
            const rawNodes = (data.nodes as Node[]).map((n) => ({
              ...n,
              position: n.position && typeof n.position.x === 'number' && typeof n.position.y === 'number'
                ? n.position
                : { x: 0, y: 0 },
              data: { ...(n.data || {}), label: n.data?.label ?? 'Узел' },
            }));
            const edgesList = (data.edges as Edge[]).filter((e) => e.id && e.source && e.target);
            const editingId = selectedNodeRef.current?.id ?? null;
            const mergedNodes: Node[] = rawNodes.map((n) => {
              if (editingId && n.id === editingId && selectedNodeRef.current?.data) {
                return { ...n, data: { ...n.data, ...selectedNodeRef.current!.data } };
              }
              return n;
            });
            setNodes(mergedNodes);
            setEdges(edgesList);
            const nextSelected = editingId ? mergedNodes.find((n) => n.id === editingId) ?? null : null;
            setSelectedNode(nextSelected);
            skipNextSaveRef.current = true;
            setRemoteUpdateHint(true);
            setTimeout(() => setRemoteUpdateHint(false), 3000);
          }
        } catch {
          /* ignore */
        }
      };
    };

    connect();
    return () => {
      clearTimeout(reconnectTimer);
      ws?.close();
    };
  }, [loadStatus, setNodes, setEdges, setSelectedNode]);

  // Автосохранение при изменении узлов или рёбер (с задержкой)
  useEffect(() => {
    if (loadStatus !== 'loaded') return;
    if (skipNextSaveRef.current) {
      skipNextSaveRef.current = false;
      return;
    }
    const timer = setTimeout(() => {
      setSaveStatus('saving');
      fetch('/api/flow', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodes, edges }),
      })
        .then((res) => (res.ok ? setSaveStatus('saved') : setSaveStatus('error')))
        .catch(() => setSaveStatus('error'));
    }, SAVE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [nodes, edges, loadStatus]);

  const onConnect = useCallback(
    (connection: Connection) => {
      pushToHistory();
      setEdges((eds) =>
        addEdge(
          {
            ...connection,
            animated: true,
            style: { stroke: '#94a3b8', strokeWidth: 2 },
          },
          eds
        )
      );
    },
    [setEdges, pushToHistory]
  );

  const handleNodeClick = (_event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  };

  const handleDeleteNode = () => {
    if (!selectedNode) return;
    pushToHistory();
    setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
    setEdges((eds) =>
      eds.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id)
    );
    setSelectedNode(null);
  };

  const handleOpenAddNode = () => {
    setNewNodeLabel('');
    setNewNodeComment('');
    setNewNodeType('main-scene');
    setAddNodeOpen(true);
  };

  const handleConfirmAddNode = () => {
    pushToHistory();
    const stylePreset = NODE_TYPE_STYLES[newNodeType];
    const maxY = nodes.length === 0 ? 0 : Math.max(...nodes.map((n) => n.position.y));
    const newY = maxY + (NODE_HEIGHT + GAP_Y);
    const centerX = nodes.length === 0 ? 0 : nodes.reduce((s, n) => s + n.position.x, 0) / nodes.length;
    const newNode: Node = {
      id: `node-${Date.now()}`,
      data: {
        label: newNodeLabel.trim() || 'Новый узел',
        comment: newNodeComment.trim() || undefined,
        nodeType: newNodeType,
      },
      position: { x: centerX - NODE_WIDTH / 2, y: newY },
      style: {
        background: '#ffffff',
        border: stylePreset.border,
        borderRadius: '8px',
        padding: '15px',
        width: '200px',
        color: stylePreset.color,
        fontFamily: 'IBM Plex Mono, monospace',
        fontSize: '11px',
        boxShadow: stylePreset.boxShadow,
      },
    };
    setNodes((nds) => [...nds, newNode]);
    setAddNodeOpen(false);
  };

  const handleAlignNodes = useCallback(() => {
    setNodes((nds) => layoutNodes(nds, edges));
    setTimeout(() => {
      fitView({ padding: 0.2, duration: 300 });
    }, 100);
  }, [edges, setNodes, fitView]);

  const handleUpdateNodeData = (field: 'label' | 'comment', value: string) => {
    if (!selectedNode) return;
    setNodes((nds) =>
      nds.map((n) =>
        n.id === selectedNode.id
          ? { ...n, data: { ...n.data, [field]: value } }
          : n
      )
    );
    setSelectedNode((prev) =>
      prev && prev.id === selectedNode.id
        ? { ...prev, data: { ...prev.data, [field]: value } }
        : prev
    );
  };

  const handleSave = useCallback(() => {
    setSaveStatus('saving');
    fetch('/api/flow', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nodes, edges }),
    })
      .then((res) => (res.ok ? setSaveStatus('saved') : setSaveStatus('error')))
      .catch(() => setSaveStatus('error'));
  }, [nodes, edges]);

  const handleExport = () => {
    const data = {
      _comment: 'Полная схема: все узлы и связи. Редактируйте в текстовом редакторе и загрузите через Импорт.',
      nodes,
      edges,
      exportedAt: new Date().toISOString(),
    };
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `game-flow-полная-схема-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleClearAll = () => {
    if (window.confirm('Удалить все узлы и связи? Схема станет пустой.')) {
      pushToHistory();
      setNodes([]);
      setEdges([]);
      setSelectedNode(null);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        if (!text) return;
        const data = JSON.parse(text);
        const rawNodes = Array.isArray(data.nodes) ? data.nodes : [];
        const rawEdges = Array.isArray(data.edges) ? data.edges : [];
        const nodesList: Node[] = rawNodes.map((n: Node) => ({
          ...n,
          position: n.position && typeof n.position.x === 'number' && typeof n.position.y === 'number'
            ? n.position
            : { x: 0, y: 0 },
          data: { ...(n.data || {}), label: n.data?.label ?? 'Узел' },
        }));
        const edgesList = rawEdges.filter(
          (e: Edge) => e.id && e.source && e.target
        );
        setNodes(nodesList);
        setEdges(edgesList);
        setSelectedNode(null);
      } catch (err) {
        console.error('Ошибка при импорте файла:', err);
      }
    };
    reader.readAsText(file, 'UTF-8');
    event.target.value = '';
  };

  return (
    <div className="w-full h-screen flex flex-col" style={{ background: '#f8fafc' }}>
      {/* Заголовок */}
      <header
        className="border-b px-6 py-4 flex justify-between items-center"
        style={{
          borderColor: '#e2e8f0',
          background: '#fff',
        }}
      >
        <div>
          <h1
            className="text-2xl font-bold"
            style={{
              fontFamily: 'IBM Plex Mono, monospace',
              color: '#5a4d66',
              textShadow: 'none',
            }}
          >
            GAME FLOW VISUALIZER
          </h1>
          <p
            className="text-sm mt-1 min-h-[1.5rem] flex items-center flex-wrap gap-x-2"
            style={{
              fontFamily: 'IBM Plex Mono, monospace',
              color: '#475569',
            }}
          >
            <span>Интерактивная схема выбора игры &quot;Первый день в кампусе&quot;</span>
            {saveStatus === 'saved' && (
              <span className="text-[#475569]">• Сохранено</span>
            )}
            {saveStatus === 'saving' && (
              <span className="text-[#64748b]">• Сохранение…</span>
            )}
            {saveStatus === 'error' && (
              <span className="text-[#dc2626]">• Ошибка сохранения</span>
            )}
            {wsConnected && (
              <span className="text-[#3d5048]">• Совместное редактирование</span>
            )}
            {remoteUpdateHint && (
              <span className="text-[#047857] font-medium">• Обновлено другим пользователем</span>
            )}
          </p>
        </div>

        {/* Кнопки управления */}
        <div className="flex gap-2">
          <Button
            onClick={handleOpenAddNode}
            className="flex items-center gap-2"
            style={{
              background: '#475569',
              color: '#fff',
              border: 'none',
              fontFamily: 'IBM Plex Mono, monospace',
              fontWeight: 'bold',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <Plus size={16} />
            Добавить узел
          </Button>

          <Button
            onClick={handleUndo}
            disabled={!canUndo}
            className="flex items-center gap-2"
            style={{
              background: canUndo ? '#64748b' : '#cbd5e1',
              color: '#fff',
              border: 'none',
              fontFamily: 'IBM Plex Mono, monospace',
              fontWeight: 'bold',
            }}
            onMouseEnter={(e) => canUndo && (e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)')}
            onMouseLeave={(e) => (e.currentTarget.style.boxShadow = 'none')}
          >
            <Undo2 size={16} />
            Вернуть
          </Button>
          <Button
            onClick={handleRedo}
            disabled={!canRedo}
            className="flex items-center gap-2"
            style={{
              background: canRedo ? '#64748b' : '#cbd5e1',
              color: '#fff',
              border: 'none',
              fontFamily: 'IBM Plex Mono, monospace',
              fontWeight: 'bold',
            }}
            onMouseEnter={(e) => canRedo && (e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)')}
            onMouseLeave={(e) => (e.currentTarget.style.boxShadow = 'none')}
          >
            <Redo2 size={16} />
            Вперёд
          </Button>

          {selectedNode && (
            <Button
              onClick={handleDeleteNode}
              className="flex items-center gap-2"
              style={{
                background: '#64748b',
                color: '#fff',
                border: 'none',
                fontFamily: 'IBM Plex Mono, monospace',
                fontWeight: 'bold',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <Trash2 size={16} />
              Удалить узел
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                className="flex items-center gap-2"
                style={{
                  background: '#64748b',
                  color: '#fff',
                  border: 'none',
                  fontFamily: 'IBM Plex Mono, monospace',
                  fontWeight: 'bold',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <User size={16} />
                Кабинет
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
              <DropdownMenuItem
                onClick={handleClearAll}
                style={{ color: '#475569', cursor: 'pointer' }}
              >
                <Eraser size={14} className="mr-2" />
                Очистить все
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            onClick={handleSave}
            className="flex items-center gap-2"
            style={{
              background: '#059669',
              color: '#fff',
              border: 'none',
              fontFamily: 'IBM Plex Mono, monospace',
              fontWeight: 'bold',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <Save size={16} />
            Сохранить
          </Button>
          <Button
            onClick={handleExport}
            className="flex items-center gap-2"
            style={{
              background: '#64748b',
              color: '#fff',
              border: 'none',
              fontFamily: 'IBM Plex Mono, monospace',
              fontWeight: 'bold',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <Download size={16} />
            Экспорт
          </Button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleImport}
            className="hidden"
            aria-hidden
          />
          <Button
            type="button"
            onClick={handleImportClick}
            className="flex items-center gap-2"
            style={{
              background: '#64748b',
              color: '#fff',
              border: 'none',
              fontFamily: 'IBM Plex Mono, monospace',
              fontWeight: 'bold',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <Upload size={16} />
            Импорт
          </Button>
        </div>
      </header>

      {/* Диалог: создать узел с текстом и комментарием */}
      <Dialog open={addNodeOpen} onOpenChange={setAddNodeOpen}>
        <DialogContent
          className="gap-4"
          style={{
            background: '#fff',
            border: '1px solid #cbd5e1',
            fontFamily: 'IBM Plex Mono, monospace',
          }}
        >
          <DialogHeader>
            <DialogTitle style={{ color: '#334155' }}>Новый узел</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="new-node-label" style={{ color: '#475569' }}>
                Название узла
              </Label>
              <Input
                id="new-node-label"
                value={newNodeLabel}
                onChange={(e) => setNewNodeLabel(e.target.value)}
                placeholder="Введите текст узла"
                className="bg-white border-[#e2e8f0] text-[#334155]"
              />
            </div>
            <div className="grid gap-2">
              <Label style={{ color: '#475569', fontWeight: 600 }}>
                Тип узла
              </Label>
              <div className="space-y-2">
                {(
                  [
                    ['main-scene', 'Главные сцены', '#8b7aa8', '#5a4d66'],
                    ['character-meeting', 'Встречи с персонажами', '#0d9488', '#0f766e'],
                    ['choice', 'Варианты выбора', '#059669', '#047857'],
                  ] as const
                ).map(([type, title, borderColor, textColor]) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setNewNodeType(type)}
                    className="w-full flex items-center gap-3 rounded-lg border-2 px-3 py-2 text-left text-sm transition-colors"
                    style={{
                      borderColor: newNodeType === type ? borderColor : '#e2e8f0',
                      background: newNodeType === type ? `${borderColor}18` : '#f8fafc',
                      color: textColor,
                      fontFamily: 'IBM Plex Mono, monospace',
                      fontWeight: newNodeType === type ? 600 : 500,
                    }}
                  >
                    <div
                      className="w-4 h-4 rounded-sm shrink-0"
                      style={{
                        background: newNodeType === type ? `${borderColor}35` : '#e2e8f0',
                        border: `2px solid ${borderColor}`,
                      }}
                    />
                    {title}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid gap-2">
              <Textarea
                id="new-node-comment"
                value={newNodeComment}
                onChange={(e) => setNewNodeComment(e.target.value)}
                placeholder="Необязательно"
                rows={2}
                className="bg-[#f1f5f9] border-[#cbd5e1] text-[#475569] resize-none"
                aria-label="Комментарий"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setAddNodeOpen(false)}
              style={{ borderColor: '#cbd5e1', color: '#475569' }}
            >
              Отмена
            </Button>
            <Button
              type="button"
              onClick={handleConfirmAddNode}
              style={{ background: '#475569', color: '#fff' }}
            >
              Добавить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Основная область с потоком */}
      <div className="flex-1 flex gap-4 overflow-hidden min-h-0">
        {/* React Flow */}
        <div className="flex-1 relative min-h-0 min-w-0">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={handleNodeClick}
            nodeTypes={nodeTypes}
            fitView
          >
            <Background
              color="#ffffff"
              gap={16}
              style={{
                backgroundColor: '#f1f5f9',
              }}
            />
            <Controls
              onZoomOut={() => {
                zoomOut();
                zoomOut();
              }}
              style={{
                background: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid #e2e8f0',
                borderRadius: '0px',
              }}
            >
              <button
                type="button"
                onClick={handleAlignNodes}
                className="react-flow__controls-button"
                title="Выровнять узлы (раскладка без наложения и подогнать вид)"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '100%',
                  height: '100%',
                }}
              >
                <LayoutGrid size={16} style={{ color: '#475569' }} />
              </button>
            </Controls>
            <MiniMap
              style={{
                background: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid #e2e8f0',
                borderRadius: '0px',
              }}
              maskColor="rgba(0,0,0,0.04)"
            />
          </ReactFlow>
        </div>

        {/* Панель информации */}
        <div
          className="w-80 border-l p-6 overflow-y-auto"
          style={{
            borderColor: '#e2e8f0',
            background: '#f8fafc',
          }}
        >
          <h2
            className="text-lg font-bold mb-4"
            style={{
              fontFamily: 'IBM Plex Mono, monospace',
              color: '#475569',
              textShadow: 'none',
            }}
          >
            ИНФОРМАЦИЯ
          </h2>

          {selectedNode ? (
            <div className="space-y-4">
              <div>
                <label
                  className="block text-xs font-bold mb-2"
                  style={{
                    fontFamily: 'IBM Plex Mono, monospace',
                    color: '#475569',
                  }}
                >
                  ID УЗЛА
                </label>
                <p
                  className="text-sm break-all"
                  style={{
                    fontFamily: 'IBM Plex Mono, monospace',
                    color: '#475569',
                  }}
                >
                  {selectedNode.id}
                </p>
              </div>

              <div>
                <Label
                  className="block text-xs font-bold mb-2"
                  style={{ fontFamily: 'IBM Plex Mono, monospace', color: '#475569' }}
                >
                  НАЗВАНИЕ
                </Label>
                <Input
                  value={selectedNode.data?.label ?? ''}
                  onChange={(e) => handleUpdateNodeData('label', e.target.value)}
                  placeholder="Текст узла"
                  className="bg-white border-[#e2e8f0] text-[#334155] text-sm mb-2"
                />
              </div>

              <div>
                <Textarea
                  value={selectedNode.data?.comment ?? ''}
                  onChange={(e) => handleUpdateNodeData('comment', e.target.value)}
                  placeholder="Необязательно"
                  rows={2}
                  className="bg-white border-[#e2e8f0] text-[#475569] text-sm resize-none"
                  aria-label="Комментарий"
                />
              </div>

              {selectedNode.data?.character && (
                <div>
                  <label
                    className="block text-xs font-bold mb-2"
                    style={{
                      fontFamily: 'IBM Plex Mono, monospace',
                      color: '#475569',
                    }}
                  >
                    ПЕРСОНАЖ
                  </label>
                  <p
                    className="text-sm"
                    style={{
                      fontFamily: 'IBM Plex Mono, monospace',
                      color: '#5a4d66',
                    }}
                  >
                    {selectedNode.data.character}
                  </p>
                </div>
              )}

              </div>
          ) : (
            <div
              className="text-center py-8"
              style={{
                color: '#475569',
                fontFamily: 'IBM Plex Mono, monospace',
              }}
            >
              <p className="text-sm">Выберите узел для просмотра информации</p>
            </div>
          )}

          {/* Легенда */}
          <div className="mt-8 pt-6 border-t" style={{ borderColor: '#e2e8f0' }}>
            <h3
              className="text-sm font-bold mb-4"
              style={{
                fontFamily: 'IBM Plex Mono, monospace',
                color: '#475569',
              }}
            >
              ЛЕГЕНДА
            </h3>
            <div className="space-y-3 text-xs" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded-sm shrink-0"
                  style={{
                    background: '#f3f0f5',
                    border: '2px solid #8b7aa8',
                  }}
                />
                <span style={{ color: '#5a4d66', fontWeight: 600 }}>Главные сцены</span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded-sm shrink-0"
                  style={{
                    background: '#e6f7f6',
                    border: '2px solid #0d9488',
                  }}
                />
                <span style={{ color: '#0f766e', fontWeight: 600 }}>Встречи с персонажами</span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded-sm shrink-0"
                  style={{
                    background: '#ecfdf5',
                    border: '2px solid #059669',
                  }}
                />
                <span style={{ color: '#047857', fontWeight: 600 }}>Варианты выбора</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
