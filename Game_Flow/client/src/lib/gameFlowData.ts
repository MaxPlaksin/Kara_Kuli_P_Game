import { Node, Edge } from 'reactflow';

export interface GameNode extends Node {
  data: {
    label: string;
    description?: string;
    /** Комментарий к узлу (отображается другим цветом на карте) */
    comment?: string;
    character?: string;
    sceneNumber?: string;
  };
}

export const initialNodes: GameNode[] = [
  // Сцена 1: Ворота в новую жизнь
  {
    id: '1',
    data: {
      label: 'Ворота в новую жизнь',
      description: 'Ты стоишь перед университетом',
      sceneNumber: 'Сцена 1',
    },
    position: { x: 400, y: 0 },
    style: {
      background: '#ffffff',
      border: '1px solid #a89bb4',
      borderRadius: '8px',
      padding: '20px',
      width: '280px',
      color: '#5a4d66',
      fontFamily: 'IBM Plex Mono, monospace',
      fontSize: '12px',
      fontWeight: 'bold',
      boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
    },
  },

  // Выбор 1: Лена
  {
    id: '1.1',
    data: {
      label: 'Выбор 1: Лена',
      description: 'Пойти к стенду помощи',
      character: 'Лена',
    },
    position: { x: 50, y: 150 },
    style: {
      background: '#ffffff',
      border: '1px solid #8a9e82',
      borderRadius: '8px',
      padding: '15px',
      width: '200px',
      color: '#3d4d38',
      fontFamily: 'IBM Plex Mono, monospace',
      fontSize: '11px',
      boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
    },
  },

  // Выбор 2: Алиса
  {
    id: '1.2',
    data: {
      label: 'Выбор 2: Алиса',
      description: 'Пройти через парк',
      character: 'Алиса',
    },
    position: { x: 350, y: 150 },
    style: {
      background: '#ffffff',
      border: '1px solid #8a9e82',
      borderRadius: '8px',
      padding: '15px',
      width: '200px',
      color: '#3d4d38',
      fontFamily: 'IBM Plex Mono, monospace',
      fontSize: '11px',
      boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
    },
  },

  // Выбор 3: Соня
  {
    id: '1.3',
    data: {
      label: 'Выбор 3: Соня',
      description: 'Разобраться самому',
      character: 'Соня',
    },
    position: { x: 650, y: 150 },
    style: {
      background: '#ffffff',
      border: '1px solid #8a9e82',
      borderRadius: '8px',
      padding: '15px',
      width: '200px',
      color: '#3d4d38',
      fontFamily: 'IBM Plex Mono, monospace',
      fontSize: '11px',
      boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
    },
  },

  // Продолжение Лены
  {
    id: '1.1.1',
    data: {
      label: 'Лена провожает',
      description: 'Лена идет с тобой в общежитие',
    },
    position: { x: 50, y: 300 },
    style: {
      background: '#ffffff',
      border: '1px solid #7d9a8a',
      borderRadius: '8px',
      padding: '15px',
      width: '200px',
      color: '#3d5048',
      fontFamily: 'IBM Plex Mono, monospace',
      fontSize: '11px',
      boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
    },
  },

  // Вариант 1.1.1: Зайти в общежитие
  {
    id: '1.1.1.1',
    data: {
      label: 'Зайти в общежитие',
      description: 'Заселиться в комнату 412',
    },
    position: { x: -100, y: 420 },
    style: {
      background: '#ffffff',
      border: '1px solid #8a9e82',
      borderRadius: '8px',
      padding: '12px',
      width: '180px',
      color: '#3d4d38',
      fontFamily: 'IBM Plex Mono, monospace',
      fontSize: '10px',
      boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
    },
  },

  // Вариант 1.1.2: Догнать Лену
  {
    id: '1.1.1.2',
    data: {
      label: 'Догнать Лену',
      description: 'Попросить показать кампус',
    },
    position: { x: 100, y: 420 },
    style: {
      background: '#ffffff',
      border: '1px solid #8a9e82',
      borderRadius: '8px',
      padding: '12px',
      width: '180px',
      color: '#3d4d38',
      fontFamily: 'IBM Plex Mono, monospace',
      fontSize: '10px',
      boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
    },
  },

  // Вариант 1.1.3: Осмотреться
  {
    id: '1.1.1.3',
    data: {
      label: 'Осмотреться',
      description: 'Остаться у входа',
    },
    position: { x: 300, y: 420 },
    style: {
      background: '#ffffff',
      border: '1px solid #8a9e82',
      borderRadius: '8px',
      padding: '12px',
      width: '180px',
      color: '#3d4d38',
      fontFamily: 'IBM Plex Mono, monospace',
      fontSize: '10px',
      boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
    },
  },

  // Вечеринка
  {
    id: '1.1.2',
    data: {
      label: 'Вечеринка в клубе',
      description: 'Встреча с Леной на вечеринке',
    },
    position: { x: 50, y: 550 },
    style: {
      background: '#ffffff',
      border: '1px solid #7d9a8a',
      borderRadius: '8px',
      padding: '15px',
      width: '200px',
      color: '#3d5048',
      fontFamily: 'IBM Plex Mono, monospace',
      fontSize: '11px',
      boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
    },
  },

  // Варианты ответов на вечеринке
  {
    id: '1.1.2.1',
    data: {
      label: 'Энтузиазм',
      description: 'Отлично! Я рад',
    },
    position: { x: -100, y: 680 },
    style: {
      background: '#ffffff',
      border: '1px solid #8a9e82',
      borderRadius: '8px',
      padding: '12px',
      width: '160px',
      color: '#3d4d38',
      fontFamily: 'IBM Plex Mono, monospace',
      fontSize: '10px',
      boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
    },
  },

  {
    id: '1.1.2.2',
    data: {
      label: 'Заинтересованность',
      description: 'Я ищу тебя',
    },
    position: { x: 50, y: 680 },
    style: {
      background: '#ffffff',
      border: '1px solid #8a9e82',
      borderRadius: '8px',
      padding: '12px',
      width: '160px',
      color: '#3d4d38',
      fontFamily: 'IBM Plex Mono, monospace',
      fontSize: '10px',
      boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
    },
  },

  {
    id: '1.1.2.3',
    data: {
      label: 'Наивность',
      description: 'Первая вечеринка',
    },
    position: { x: 200, y: 680 },
    style: {
      background: '#ffffff',
      border: '1px solid #8a9e82',
      borderRadius: '8px',
      padding: '12px',
      width: '160px',
      color: '#3d4d38',
      fontFamily: 'IBM Plex Mono, monospace',
      fontSize: '10px',
      boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
    },
  },

  // Продолжение Алисы
  {
    id: '1.2.1',
    data: {
      label: 'Встреча с Алисой',
      description: 'Алиса рисует в парке',
    },
    position: { x: 350, y: 300 },
    style: {
      background: '#ffffff',
      border: '1px solid #7d9a8a',
      borderRadius: '8px',
      padding: '15px',
      width: '200px',
      color: '#3d5048',
      fontFamily: 'IBM Plex Mono, monospace',
      fontSize: '11px',
      boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
    },
  },

  // Варианты после Алисы
  {
    id: '1.2.1.1',
    data: {
      label: 'Поиск в соцсетях',
      description: 'Найти Алису онлайн',
    },
    position: { x: 250, y: 420 },
    style: {
      background: '#ffffff',
      border: '1px solid #8a9e82',
      borderRadius: '8px',
      padding: '12px',
      width: '160px',
      color: '#3d4d38',
      fontFamily: 'IBM Plex Mono, monospace',
      fontSize: '10px',
      boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
    },
  },

  {
    id: '1.2.1.2',
    data: {
      label: 'Прогулка по кампусу',
      description: 'Встретить Алису снова',
    },
    position: { x: 420, y: 420 },
    style: {
      background: '#ffffff',
      border: '1px solid #8a9e82',
      borderRadius: '8px',
      padding: '12px',
      width: '160px',
      color: '#3d4d38',
      fontFamily: 'IBM Plex Mono, monospace',
      fontSize: '10px',
      boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
    },
  },

  {
    id: '1.2.1.3',
    data: {
      label: 'Забыть о ней',
      description: 'Обустроиться в общежитии',
    },
    position: { x: 590, y: 420 },
    style: {
      background: '#ffffff',
      border: '1px solid #8a9e82',
      borderRadius: '8px',
      padding: '12px',
      width: '160px',
      color: '#3d4d38',
      fontFamily: 'IBM Plex Mono, monospace',
      fontSize: '10px',
      boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
    },
  },

  // Продолжение Сони
  {
    id: '1.3.1',
    data: {
      label: 'Встреча с Соней',
      description: 'Соня помогает с картой',
    },
    position: { x: 650, y: 300 },
    style: {
      background: '#ffffff',
      border: '1px solid #7d9a8a',
      borderRadius: '8px',
      padding: '15px',
      width: '200px',
      color: '#3d5048',
      fontFamily: 'IBM Plex Mono, monospace',
      fontSize: '11px',
      boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
    },
  },

  // Варианты после Сони
  {
    id: '1.3.1.1',
    data: {
      label: 'Общежитие',
      description: 'Найти свою комнату',
    },
    position: { x: 550, y: 420 },
    style: {
      background: '#ffffff',
      border: '1px solid #8a9e82',
      borderRadius: '8px',
      padding: '12px',
      width: '160px',
      color: '#3d4d38',
      fontFamily: 'IBM Plex Mono, monospace',
      fontSize: '10px',
      boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
    },
  },

  {
    id: '1.3.1.2',
    data: {
      label: 'Думать о Соне',
      description: 'Встреча в библиотеке',
    },
    position: { x: 720, y: 420 },
    style: {
      background: '#ffffff',
      border: '1px solid #8a9e82',
      borderRadius: '8px',
      padding: '12px',
      width: '160px',
      color: '#3d4d38',
      fontFamily: 'IBM Plex Mono, monospace',
      fontSize: '10px',
      boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
    },
  },

  {
    id: '1.3.1.3',
    data: {
      label: 'Соседи по комнате',
      description: 'Познакомиться с соседом',
    },
    position: { x: 890, y: 420 },
    style: {
      background: '#ffffff',
      border: '1px solid #8a9e82',
      borderRadius: '8px',
      padding: '12px',
      width: '160px',
      color: '#3d4d38',
      fontFamily: 'IBM Plex Mono, monospace',
      fontSize: '10px',
      boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
    },
  },
];

export const initialEdges: Edge[] = [
  // От главной сцены к трем выборам
  {
    id: 'e1-1.1',
    source: '1',
    target: '1.1',
    animated: true,
    style: { stroke: '#94a3b8', strokeWidth: 2 },
  },
  {
    id: 'e1-1.2',
    source: '1',
    target: '1.2',
    animated: true,
    style: { stroke: '#94a3b8', strokeWidth: 2 },
  },
  {
    id: 'e1-1.3',
    source: '1',
    target: '1.3',
    animated: true,
    style: { stroke: '#94a3b8', strokeWidth: 2 },
  },

  // От выбора 1 к продолжению
  {
    id: 'e1.1-1.1.1',
    source: '1.1',
    target: '1.1.1',
    animated: true,
    style: { stroke: '#94a3b8', strokeWidth: 2 },
  },

  // От продолжения Лены к вариантам
  {
    id: 'e1.1.1-1.1.1.1',
    source: '1.1.1',
    target: '1.1.1.1',
    animated: true,
    style: { stroke: '#94a3b8', strokeWidth: 2 },
  },
  {
    id: 'e1.1.1-1.1.1.2',
    source: '1.1.1',
    target: '1.1.1.2',
    animated: true,
    style: { stroke: '#94a3b8', strokeWidth: 2 },
  },
  {
    id: 'e1.1.1-1.1.1.3',
    source: '1.1.1',
    target: '1.1.1.3',
    animated: true,
    style: { stroke: '#94a3b8', strokeWidth: 2 },
  },

  // От варианта 1.1.1.2 к вечеринке
  {
    id: 'e1.1.1.2-1.1.2',
    source: '1.1.1.2',
    target: '1.1.2',
    animated: true,
    style: { stroke: '#94a3b8', strokeWidth: 2 },
  },

  // От вечеринки к вариантам ответов
  {
    id: 'e1.1.2-1.1.2.1',
    source: '1.1.2',
    target: '1.1.2.1',
    animated: true,
    style: { stroke: '#94a3b8', strokeWidth: 2 },
  },
  {
    id: 'e1.1.2-1.1.2.2',
    source: '1.1.2',
    target: '1.1.2.2',
    animated: true,
    style: { stroke: '#94a3b8', strokeWidth: 2 },
  },
  {
    id: 'e1.1.2-1.1.2.3',
    source: '1.1.2',
    target: '1.1.2.3',
    animated: true,
    style: { stroke: '#94a3b8', strokeWidth: 2 },
  },

  // От выбора 2 к встрече с Алисой
  {
    id: 'e1.2-1.2.1',
    source: '1.2',
    target: '1.2.1',
    animated: true,
    style: { stroke: '#94a3b8', strokeWidth: 2 },
  },

  // От встречи с Алисой к вариантам
  {
    id: 'e1.2.1-1.2.1.1',
    source: '1.2.1',
    target: '1.2.1.1',
    animated: true,
    style: { stroke: '#94a3b8', strokeWidth: 2 },
  },
  {
    id: 'e1.2.1-1.2.1.2',
    source: '1.2.1',
    target: '1.2.1.2',
    animated: true,
    style: { stroke: '#94a3b8', strokeWidth: 2 },
  },
  {
    id: 'e1.2.1-1.2.1.3',
    source: '1.2.1',
    target: '1.2.1.3',
    animated: true,
    style: { stroke: '#94a3b8', strokeWidth: 2 },
  },

  // От выбора 3 к встрече с Соней
  {
    id: 'e1.3-1.3.1',
    source: '1.3',
    target: '1.3.1',
    animated: true,
    style: { stroke: '#94a3b8', strokeWidth: 2 },
  },

  // От встречи с Соней к вариантам
  {
    id: 'e1.3.1-1.3.1.1',
    source: '1.3.1',
    target: '1.3.1.1',
    animated: true,
    style: { stroke: '#94a3b8', strokeWidth: 2 },
  },
  {
    id: 'e1.3.1-1.3.1.2',
    source: '1.3.1',
    target: '1.3.1.2',
    animated: true,
    style: { stroke: '#94a3b8', strokeWidth: 2 },
  },
  {
    id: 'e1.3.1-1.3.1.3',
    source: '1.3.1',
    target: '1.3.1.3',
    animated: true,
    style: { stroke: '#94a3b8', strokeWidth: 2 },
  },
];
