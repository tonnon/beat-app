import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import './tree.scss';

type Leaf = {
  top: number;
  left: number;
  width: number;
  height: number;
  rotate: number;
};

type Ornament = {
  top: number;
  left: number;
  size: number;
  label: string;
};

type RemovedLeaf = {
  leaf: Leaf;
  note: string;
  index: number;
};

type Dimensions = {
  width: number;
  height: number;
  scale: number;
};

type NotePosition = {
  top: number;
  left: number;
};

type TreeBounds = {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
};

const ENABLE_LEAVES = true;

const archivedLeaves: ReadonlyArray<Leaf> = [
  { top: 130, left: 55, width: 50, height: 50, rotate: 200 },
  { top: 25, left: 120, width: 50, height: 50, rotate: 310 },
  { top: 90, left: 168, width: 65, height: 65, rotate: 35 },
  { top: 98, left: 40, width: 44, height: 44, rotate: 220 },
  { top: 71, left: 50, width: 39, height: 39, rotate: 230 },
  { top: 61, left: 45, width: 24, height: 24, rotate: 250 },
  { top: 53, left: 91, width: 48, height: 48, rotate: 275 },
  { top: 36, left: 63, width: 28, height: 28, rotate: 270 },
  { top: 15, left: 80, width: 32, height: 32, rotate: 280 },
  { top: 0, left: 108, width: 36, height: 36, rotate: 290 },
  { top: 6, left: 144, width: 24, height: 24, rotate: 312 },
  { top: 139, left: 140, width: 24, height: 24, rotate: 10 },
  { top: 82, left: 196, width: 39, height: 39, rotate: 50 },
  { top: 71, left: 218, width: 24, height: 24, rotate: 10 },
  { top: 54, left: 156, width: 48, height: 48, rotate: 0 },
  { top: 47, left: 205, width: 29, height: 29, rotate: 20 },
  { top: 25, left: 186, width: 32, height: 32, rotate: 350 },
  { top: 27, left: 155, width: 36, height: 36, rotate: 318 },
  { top: 110, left: 82, width: 25, height: 25, rotate: 200 },
  { top: 142, left: 168, width: 32, height: 32, rotate: 12 },
];

const initialLeaves: Leaf[] = ENABLE_LEAVES ? [...archivedLeaves] : [];

const initialOrnaments: Ornament[] = [
  { top: 215, left: 143, size: 10, label: '' },
  { top: 175, left: 161, size: 10, label: '' },
  { top: 151, left: 164, size: 10, label: '' },
  { top: 134, left: 126, size: 10, label: '' },
  { top: 105, left: 140, size: 10, label: '' },
];

const BASE_WIDTH = 280;
const BASE_HEIGHT = 300;
const NOTE_WIDTH = 200;
const MAX_TREE_SCALE = 2;
const MIN_TREE_SCALE = 0.6;
const DEFAULT_TREE_SCALE = MAX_TREE_SCALE;
const MAX_CANVAS_WIDTH = BASE_WIDTH * MAX_TREE_SCALE;
const MAX_LEAVES = 20;
const MIN_LEAVES = 6;
const TRUNK_CENTER_X = BASE_WIDTH / 2;
const BRANCH_PROTECTION_RADIUS = 60;
const BRANCH_PROTECTION_MIN_TOP = 50;
const BRANCH_PROTECTION_MAX_TOP = 170;
const PROTECTED_LEAF_KEYS = new Set(['120|25', '168|90']);
const REMOVAL_OVERRIDE_KEYS = new Set(['55|130', '140|139']);

const clampValue = (value: number, min: number, max: number): number => {
  if (value < min) {
    return min;
  }

  if (value > max) {
    return max;
  }

  return value;
};

const computeDimensions = (containerWidth?: number): Dimensions => {
  const fallbackScale = DEFAULT_TREE_SCALE;

  if (!containerWidth || containerWidth <= 0) {
    return {
      width: BASE_WIDTH * fallbackScale,
      height: BASE_HEIGHT * fallbackScale,
      scale: fallbackScale,
    };
  }

  const ratio = containerWidth / BASE_WIDTH;

  if (ratio >= MIN_TREE_SCALE) {
    const scale = clampValue(ratio, MIN_TREE_SCALE, MAX_TREE_SCALE);

    return {
      width: BASE_WIDTH * scale,
      height: BASE_HEIGHT * scale,
      scale,
    };
  }

  const scale = Math.max(ratio, 0.001);

  return {
    width: BASE_WIDTH * scale,
    height: BASE_HEIGHT * scale,
    scale,
  };
};

const isLeafProtected = ({ left, width, top }: Leaf): boolean => {
  const key = `${left}|${top}`;

  if (REMOVAL_OVERRIDE_KEYS.has(key)) {
    return false;
  }

  if (PROTECTED_LEAF_KEYS.has(key)) {
    return true;
  }

  const centerX = left + width / 2;
  const distanceFromCenter = Math.abs(centerX - TRUNK_CENTER_X);

  return (
    distanceFromCenter <= BRANCH_PROTECTION_RADIUS &&
    top >= BRANCH_PROTECTION_MIN_TOP &&
    top <= BRANCH_PROTECTION_MAX_TOP
  );
};

const animateLeaves = (treeElement: HTMLDivElement | null): (() => void) | undefined => {
  if (!treeElement) {
    return undefined;
  }

  const leafNodes = treeElement.querySelectorAll<SVGElement>('.leaf-icon');
  const animations: Animation[] = [];

  leafNodes.forEach((leaf, index) => {
    if (index < 3) {
      return;
    }

    const baseRotate = Number(leaf.dataset.rotate ?? 0);
    const baseLeft = Number(leaf.dataset.left ?? 0);
    const baseTop = Number(leaf.dataset.top ?? 0);

    const randomSign = () => (Math.round(Math.random()) * 2 - 1);
    const horizontalOffset = randomSign() * Math.round(Math.random() * 10);
    const verticalOffset = randomSign() * Math.round(Math.random() * 10);
    const rotationOffset = randomSign() * Math.round(Math.random() * 20);

    const animation = leaf.animate(
      [
        {
          transform: `translate3d(${baseLeft}px, ${baseTop}px, 0) rotate(${baseRotate}deg)`,
        },
        {
          transform: `translate3d(${baseLeft + horizontalOffset}px, ${baseTop + verticalOffset}px, 0) rotate(${baseRotate + rotationOffset}deg)`,
        },
      ],
      {
        iterations: Infinity,
        direction: 'alternate',
        easing: 'ease-in-out',
        duration: 3000,
      },
    );

    animations.push(animation);
  });

  return () => {
    animations.forEach((animation) => animation.cancel());
  };
};

export default function Tree() {
  const treeRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLDivElement | null>(null);

  const [leaves, setLeaves] = useState<Leaf[]>(initialLeaves);
  const [activeLeaf, setActiveLeaf] = useState<number | null>(null);
  const [leafNotes, setLeafNotes] = useState<string[]>(() => initialLeaves.map(() => ''));
  const [removedLeaves, setRemovedLeaves] = useState<RemovedLeaf[]>([]);
  const [ornamentStates, setOrnamentStates] = useState<boolean[]>(
    () => initialOrnaments.map(() => false),
  );
  const [dimensions, setDimensions] = useState<Dimensions>(() => computeDimensions());

  useEffect(() => {
    if (!ENABLE_LEAVES) {
      return undefined;
    }

    const cancelAnimations = animateLeaves(treeRef.current);

    return () => {
      cancelAnimations?.();
    };
  }, [leaves.length]);

  useLayoutEffect(() => {
    const element = treeRef.current;

    if (!element) {
      return;
    }

    element.removeAttribute('aria-hidden');
  }, []);

  useEffect(() => {
    const element = treeRef.current;

    if (!element) {
      return;
    }

    element.removeAttribute('aria-hidden');
  }, [dimensions.height, dimensions.scale, dimensions.width]);

  useEffect(() => {
    const canvasElement = canvasRef.current;

    if (!canvasElement) {
      return;
    }

    const updateFromWidth = (width: number) => {
      if (width <= 0) {
        return;
      }

      setDimensions((current) => {
        const next = computeDimensions(width);

        if (
          Math.abs(next.scale - current.scale) < 0.01 &&
          Math.abs(next.width - current.width) < 1 &&
          Math.abs(next.height - current.height) < 1
        ) {
          return current;
        }

        return next;
      });
    };

    updateFromWidth(canvasElement.clientWidth);

    if (typeof ResizeObserver === 'undefined') {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      entries.forEach((entry) => {
        updateFromWidth(entry.contentRect.width);
      });
    });

    observer.observe(canvasElement);

    return () => {
      observer.disconnect();
    };
  }, []);

  const activeLeafData = activeLeaf !== null ? leaves[activeLeaf] : null;

  const treeBounds = useMemo<TreeBounds>(() => {
    let minX = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;

    const considerLeaf = ({ left, top, width, height }: Leaf) => {
      minX = Math.min(minX, left);
      maxX = Math.max(maxX, left + width);
      minY = Math.min(minY, top);
      maxY = Math.max(maxY, top + height);
    };

    const leavesForBounds = ENABLE_LEAVES ? leaves : archivedLeaves;

    if (leavesForBounds.length > 0) {
      leavesForBounds.forEach(considerLeaf);
    } else {
      archivedLeaves.forEach(considerLeaf);
    }

    initialOrnaments.forEach(({ left, top, size }) => {
      const radius = size / 2;
      minX = Math.min(minX, left - radius);
      maxX = Math.max(maxX, left + radius);
      minY = Math.min(minY, top - radius);
      maxY = Math.max(maxY, top + radius);
    });

    if (!Number.isFinite(minX) || !Number.isFinite(maxX) || !Number.isFinite(minY) || !Number.isFinite(maxY)) {
      return {
        minX: 0,
        maxX: BASE_WIDTH,
        minY: 0,
        maxY: BASE_HEIGHT,
      };
    }

    return {
      minX,
      maxX,
      minY,
      maxY,
    };
  }, [leaves]);

  const contentWidth = treeBounds.maxX - treeBounds.minX;
  const contentHeight = treeBounds.maxY - treeBounds.minY;
  const rawTranslateX = BASE_WIDTH / 2 - (treeBounds.minX + contentWidth / 2);
  const rawTranslateY = BASE_HEIGHT / 2 - (treeBounds.minY + contentHeight / 2);
  const translateX = clampValue(rawTranslateX, -treeBounds.minX, BASE_WIDTH - treeBounds.maxX);
  const translateY = clampValue(rawTranslateY, -treeBounds.minY, BASE_HEIGHT - treeBounds.maxY);

  const scaledWidth = BASE_WIDTH * dimensions.scale;
  const scaledHeight = BASE_HEIGHT * dimensions.scale;
  const horizontalOffset = Math.max(0, (dimensions.width - scaledWidth) / 2);
  const verticalOffset = Math.max(0, (dimensions.height - scaledHeight) / 2);
  const translatedHorizontalOffset = horizontalOffset + translateX * dimensions.scale;
  const translatedVerticalOffset = verticalOffset + translateY * dimensions.scale;

  const notePosition = useMemo<NotePosition | null>(() => {
    if (!activeLeafData) {
      return null;
    }

    const top = Math.max(0, Math.min(
      dimensions.height - 160,
      translatedVerticalOffset + (activeLeafData.top + activeLeafData.height + 16) * dimensions.scale,
    ));

    const left = Math.max(
      8,
      Math.min(
        dimensions.width - NOTE_WIDTH - 8,
        translatedHorizontalOffset + activeLeafData.left * dimensions.scale - NOTE_WIDTH / 2,
      ),
    );

    return { top, left };
  }, [
    activeLeafData,
    dimensions.height,
    dimensions.scale,
    dimensions.width,
    translatedHorizontalOffset,
    translatedVerticalOffset,
  ]);

  const handleLeafToggle = useCallback((index: number) => {
    setActiveLeaf((current) => (current === index ? null : index));
  }, []);

  const handleLeafKeyDown = useCallback(
    (event: KeyboardEvent<SVGSVGElement>, index: number) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleLeafToggle(index);
      }
    },
    [handleLeafToggle],
  );

  const handleNoteChange = useCallback((index: number, value: string) => {
    setLeafNotes((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }, []);

  const handleToggleOrnament = useCallback((index: number) => {
    setOrnamentStates((prev) => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });
  }, []);

  const handleAddLeaf = useCallback(() => {
    if (leaves.length >= MAX_LEAVES) {
      return;
    }

    if (removedLeaves.length > 0) {
      const { leaf: restoredLeaf, note: restoredNote, index } = removedLeaves[removedLeaves.length - 1];

      setLeaves((prevLeaves) => {
        const nextLeaves = [...prevLeaves];
        nextLeaves.splice(index, 0, restoredLeaf);
        return nextLeaves;
      });

      setLeafNotes((prevNotes) => {
        const nextNotes = [...prevNotes];
        nextNotes.splice(index, 0, restoredNote);
        return nextNotes;
      });

      setRemovedLeaves((prevRemoved) => prevRemoved.slice(0, -1));
      setActiveLeaf(index);
      return;
    }

    const newLeaf: Leaf = {
      top: Math.round(40 + Math.random() * (BASE_HEIGHT - 100)),
      left: Math.round(40 + Math.random() * (BASE_WIDTH - 80)),
      width: Math.round(36 + Math.random() * 18),
      height: Math.round(36 + Math.random() * 18),
      rotate: Math.round(Math.random() * 360),
    };

    setLeaves((prevLeaves) => {
      const nextLeaves = [...prevLeaves, newLeaf];
      setLeafNotes((prevNotes) => [...prevNotes, '']);
      setActiveLeaf(nextLeaves.length - 1);
      return nextLeaves;
    });
  }, [leaves.length, removedLeaves]);

  const handleRemoveLeaf = useCallback(() => {
    if (leaves.length <= MIN_LEAVES) {
      return;
    }

    const preferredKey = '140|139';
    let targetIndex = leaves.findIndex((leaf) => `${leaf.left}|${leaf.top}` === preferredKey);

    if (targetIndex === -1) {
      targetIndex = leaves.reduce<number | null>((bestIndex, leaf, index) => {
        if (isLeafProtected(leaf)) {
          return bestIndex;
        }

        if (bestIndex === null) {
          return index;
        }

        const bestLeaf = leaves[bestIndex];
        if (leaf.top < bestLeaf.top) {
          return index;
        }

        if (leaf.top === bestLeaf.top && index < bestIndex) {
          return index;
        }

        return bestIndex;
      }, null) ?? -1;
    }

    if (targetIndex < 0) {
      return;
    }

    const removedLeaf = leaves[targetIndex];
    const removedNote = leafNotes[targetIndex];

    setRemovedLeaves((prev) => [...prev, { leaf: removedLeaf, note: removedNote, index: targetIndex }]);
    setLeaves((prev) => prev.filter((_, idx) => idx !== targetIndex));
    setLeafNotes((prev) => prev.filter((_, idx) => idx !== targetIndex));
    setActiveLeaf(null);
  }, [leafNotes, leaves]);

  return (
  <div className="tree-container">
      <div
        className="tree-canvas"
        ref={canvasRef}
        style={{ width: '100%', maxWidth: `${MAX_CANVAS_WIDTH}px`, height: `${dimensions.height}px` }}
      >
        <svg style={{ display: 'none' }} aria-hidden="true">
          <symbol id="leaf" viewBox="0 0 93.999 93.999">
            <path d="M23.602 17.519C4.491 28.608 5.588 46.67 6.246 53.353c24.684-29.24 61.606-27.822 61.606-27.822S15.514 43.484.142 79.485c-1.214 2.842 5.696 6.538 7.273 3.178 4.707-10.012 11.266-17.521 11.266-17.521 9.677 3.601 26.417 7.821 38.282-.528 15.76-11.091 14.149-35.677 36.647-47.648 5.255-2.795-44.099-14.482-70.008.553z" />
          </symbol>
        </svg>

        <div className="tree-abs">
          <div
            className="tree-wrap"
            ref={treeRef}
            style={{
              width: `${BASE_WIDTH}px`,
              height: `${BASE_HEIGHT}px`,
              transform: `scale(${dimensions.scale})`,
              transformOrigin: 'top left',
              left: `${translatedHorizontalOffset}px`,
              top: `${translatedVerticalOffset}px`,
            }}
          >
            <svg className="treeicon" viewBox="0 0 500 500" height="140">
              <path
                d="M68.498 550.001c.279.251.64.386 1.016.386h415.383a1.52 1.52 0 0 0 1.159-.532c.267-.312 6.494-7.715 2.154-17.543-7.665-17.365-47.519-38.93-193.395-43.388 2.992-4.076 6.016-8.137 9.036-12.188 20.214-27.114 36.423-54.776 49.554-84.565 11.766-26.699 23.978-57.841 19.93-89.604-3.947-30.955-19.97-60.646-35.459-89.346-1.157-2.191-2.524-4.562-3.966-7.053-7.788-13.47-17.482-30.233-6.295-41.521a1.528 1.528 0 0 0 .034-2.118 1.532 1.532 0 0 0-2.115-.123c-14.602 12.509-6.967 29.141-1.392 41.286 2.613 5.682 5.294 11.359 7.978 17.032 5.101 10.793 10.379 21.95 15.046 32.975 12.76 30.162 13.451 62.105 2.09 97.528-8.645-25.01-33.274-46.809-57.137-67.929-4.314-3.819-8.62-7.629-12.824-11.45-30.842-28.021-43.366-57.789-38.293-91.005 4.416-28.936 24.609-54.581 45.982-81.732 3.14-3.987 6.282-7.98 9.376-11.989 9.945-12.867 21.285-31.861 18.835-49.257-1.225-8.7-5.836-16.034-13.7-21.806a1.53 1.53 0 0 0-1.958 2.344c6.536 6.227 9.73 13.164 9.765 21.212.101 22.222-24.78 47.714-43.275 65.735 13.602-35.414 24.03-67.85 20.649-101.458-.079-.808-.771-1.398-1.598-1.374a1.532 1.532 0 0 0-1.453 1.53c0 32.552-15.578 64.71-30.646 95.812-15.998 33.023-32.5 67.09-30.695 102.127-1.346-2.895-2.65-5.856-3.993-8.908-10.229-23.256-20.808-47.304-59.288-61.402a1.53 1.53 0 0 0-1.175 2.819c35.766 16.854 43.348 40.523 51.377 65.582 3.957 12.353 8.048 25.125 15.848 36.698 10.964 16.27 28.011 31.387 44.498 46.007 23.051 20.441 46.886 41.577 53.596 65.631 10.594 37.987-16.08 75.01-41.876 110.812l-5 6.955c-5.896 8.229-10.814 15.138-15.587 22.313-120.677.575-189.457 14.104-198.912 39.138-4.586 12.124 6.261 21.956 6.726 22.369z"
                fill="#8c5f37"
              />
              <path
                d="M360 268C360 236 354 214 376 192C386 182 402 182 414 192L412 196C402 190 390 192 382 202C368 220 364 240 364 268Z"
                fill="#8c5f37"
              />
            </svg>
            {initialOrnaments.map(({ top, left, size, label }, index) => {
              const isActive = ornamentStates[index];

              return (
                <button
                  key={`ornament-${index}`}
                  type="button"
                  className={`ornament${isActive ? ' ornament--active' : ''}`}
                  style={{
                    width: `${size}px`,
                    height: `${size}px`,
                    transform: `translate3d(${left}px, ${top}px, 0px) translate(-50%, -50%)`,
                  }}
                  onClick={() => handleToggleOrnament(index)}
                  aria-pressed={isActive}
                  aria-label={label || undefined}
                >
                  <span className="ornament__core" />
                </button>
              );
            })}
            {ENABLE_LEAVES
              ? leaves.map(({ top, left, width, height, rotate }, index) => (
                <svg
                  key={`${left}-${top}-${index}`}
                  className="leaf-icon"
                  data-left={left}
                  data-top={top}
                  data-rotate={rotate}
                  style={{ transform: `translate3d(${left}px, ${top}px, 0) rotate(${rotate}deg)` }}
                  width={width}
                  height={height}
                  tabIndex={0}
                  role="button"
                  aria-pressed={activeLeaf === index}
                  onClick={() => handleLeafToggle(index)}
                  onKeyDown={(event) => handleLeafKeyDown(event, index)}
                >
                  <use xlinkHref="#leaf" />
                </svg>
              ))
              : null}
          </div>
          {ENABLE_LEAVES && activeLeaf !== null && notePosition && (
            <div
              className="leaf-note"
              style={{
                top: `${notePosition.top}px`,
                left: `${notePosition.left}px`,
                width: `${NOTE_WIDTH}px`,
              }}
            >
              <textarea
                className="leaf-textarea"
                aria-label="Anotação da folha"
                value={leafNotes[activeLeaf] ?? ''}
                onChange={(event) => handleNoteChange(activeLeaf, event.target.value)}
                autoFocus
                rows={4}
              />
              <button
                type="button"
                className="leaf-note-close"
                onClick={() => setActiveLeaf(null)}
              >
                Fechar
              </button>
            </div>
          )}
        </div>
      </div>
      {ENABLE_LEAVES ? (
        <div className="leaf-controls">
          <button type="button" className="leaf-button" onClick={handleAddLeaf}>
            Adicionar folha
          </button>
          <button
            type="button"
            className="leaf-button leaf-button--danger"
            onClick={handleRemoveLeaf}
            disabled={
              leaves.length <= MIN_LEAVES || leaves.every((leaf) => isLeafProtected(leaf))
            }
          >
            Remover folha selecionada
          </button>
        </div>
      ) : null}
    </div>
  );
}
