import { memo } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import type { GameNode } from '@/lib/gameFlowData';

/**
 * Кастомный узел: название (label) + комментарий другим цветом.
 * Стиль узла (фон, рамка) задаётся в node.style в ReactFlow.
 */
function GameFlowNodeComponent({ data, selected }: NodeProps<GameNode['data']>) {
  return (
    <>
      <Handle type="target" position={Position.Top} className="!w-2 !h-2 !bg-[#2dd4bf]" />
      <div style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
        <div className="font-bold break-words">
          {data.label || 'Без названия'}
        </div>
        {data.comment && (
          <div
            className="text-xs mt-1 break-words italic"
            style={{
              color: '#7c3aed',
              opacity: 0.95,
            }}
          >
            {data.comment}
          </div>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} className="!w-2 !h-2 !bg-[#2dd4bf]" />
    </>
  );
}

export const GameFlowNode = memo(GameFlowNodeComponent);
