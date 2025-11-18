import { useMemo } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { CheckIcon } from '@/components/icons/Icons';

import '@/pages/auth/singup-success/singup-success.scss';
import './dialog-celebration.scss';

export interface DialogCelebrationProps {
  readonly title: string;
  readonly description: string;
  readonly children?: ReactNode;
}

type ConfettiEdge = 'top' | 'bottom' | 'left' | 'right';

interface ConfettiPiece {
  readonly id: number;
  readonly edge: ConfettiEdge;
  readonly top: number;
  readonly left: number;
  readonly width: number;
  readonly height: number;
  readonly delay: number;
  readonly duration: number;
  readonly driftX: number;
  readonly driftY: number;
  readonly rotation: number;
  readonly background: string;
}

interface EdgeConfig {
  readonly edge: ConfettiEdge;
  readonly count: number;
  readonly topRange: readonly [number, number];
  readonly leftRange: readonly [number, number];
  readonly driftXRange: readonly [number, number];
  readonly driftYRange: readonly [number, number];
  readonly widthRange: readonly [number, number];
  readonly heightRange: readonly [number, number];
  readonly durationRange: readonly [number, number];
  readonly rotationRange: readonly [number, number];
}

const COLOR_PRIMARY = '#079fa4';
const COLOR_PRIMARY_ALT = '#00d4db';
const COLOR_SUCCESS = '#0accd3';
const COLOR_BUTTON_PRIMARY = '#fec700';
const COLOR_BUTTON_PRIMARY_HOVER = '#ffb400';
const COLOR_SUCCESS_STRONG = '#00c42b';

const CONFETTI_BACKGROUNDS: ReadonlyArray<string> = [
  COLOR_PRIMARY,
  COLOR_PRIMARY_ALT,
  COLOR_SUCCESS,
  COLOR_BUTTON_PRIMARY,
  COLOR_BUTTON_PRIMARY_HOVER,
  COLOR_SUCCESS_STRONG,
  `linear-gradient(135deg, ${COLOR_PRIMARY} 0%, ${COLOR_PRIMARY_ALT} 100%)`,
  `linear-gradient(135deg, ${COLOR_PRIMARY} 0%, ${COLOR_SUCCESS} 100%)`,
  `linear-gradient(135deg, ${COLOR_PRIMARY_ALT} 0%, ${COLOR_SUCCESS} 100%)`,
  `linear-gradient(135deg, ${COLOR_PRIMARY} 0%, ${COLOR_BUTTON_PRIMARY} 100%)`,
  `linear-gradient(135deg, ${COLOR_PRIMARY_ALT} 0%, ${COLOR_BUTTON_PRIMARY} 100%)`,
  `linear-gradient(135deg, ${COLOR_SUCCESS} 0%, ${COLOR_BUTTON_PRIMARY_HOVER} 100%)`,
  `linear-gradient(135deg, ${COLOR_BUTTON_PRIMARY} 0%, ${COLOR_SUCCESS_STRONG} 100%)`,
  `linear-gradient(135deg, ${COLOR_PRIMARY_ALT} 0%, ${COLOR_SUCCESS_STRONG} 100%)`,
  `linear-gradient(135deg, ${COLOR_PRIMARY} 0%, ${COLOR_SUCCESS_STRONG} 50%, ${COLOR_BUTTON_PRIMARY} 100%)`,
  `linear-gradient(135deg, ${COLOR_PRIMARY_ALT} 0%, ${COLOR_SUCCESS} 50%, ${COLOR_BUTTON_PRIMARY_HOVER} 100%)`,
];

const EDGE_CONFIG: ReadonlyArray<EdgeConfig> = [
  {
    edge: 'top',
    count: 64,
    topRange: [-6.5, -1],
    leftRange: [0, 100],
    driftXRange: [-14, 14],
    driftYRange: [18, 32],
    widthRange: [7.5, 11.5],
    heightRange: [4.4, 6.4],
    durationRange: [2, 2.6],
    rotationRange: [240, 400],
  },
  {
    edge: 'bottom',
    count: 56,
    topRange: [97, 106],
    leftRange: [0, 100],
    driftXRange: [-12, 12],
    driftYRange: [20, 34],
    widthRange: [7.5, 11.5],
    heightRange: [4.4, 6.4],
    durationRange: [2, 2.5],
    rotationRange: [240, 380],
  },
  {
    edge: 'left',
    count: 36,
    topRange: [-2, 102],
    leftRange: [-6, -1],
    driftXRange: [-18, -9],
    driftYRange: [12, 28],
    widthRange: [6.4, 9],
    heightRange: [3.8, 5.6],
    durationRange: [2, 2.5],
    rotationRange: [240, 400],
  },
  {
    edge: 'right',
    count: 36,
    topRange: [-2, 102],
    leftRange: [101, 106],
    driftXRange: [9, 18],
    driftYRange: [12, 28],
    widthRange: [6.4, 9],
    heightRange: [3.8, 5.6],
    durationRange: [2, 2.5],
    rotationRange: [240, 400],
  },
];

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function useConfettiPieces(): ReadonlyArray<ConfettiPiece> {
  return useMemo<ReadonlyArray<ConfettiPiece>>(() => {
    const pieces: ConfettiPiece[] = [];

    EDGE_CONFIG.forEach((config) => {
      for (let index = 0; index < config.count; index += 1) {
        const backgroundIndex = Math.floor(Math.random() * CONFETTI_BACKGROUNDS.length);
        const background = CONFETTI_BACKGROUNDS[backgroundIndex];

        pieces.push({
          id: pieces.length,
          edge: config.edge,
          top: randomBetween(config.topRange[0], config.topRange[1]),
          left: randomBetween(config.leftRange[0], config.leftRange[1]),
          width: randomBetween(config.widthRange[0], config.widthRange[1]),
          height: randomBetween(config.heightRange[0], config.heightRange[1]),
          delay: randomBetween(0, 3),
          duration: randomBetween(config.durationRange[0], config.durationRange[1]),
          driftX: randomBetween(config.driftXRange[0], config.driftXRange[1]),
          driftY: randomBetween(config.driftYRange[0], config.driftYRange[1]),
          rotation: randomBetween(config.rotationRange[0], config.rotationRange[1]),
          background,
        });
      }
    });

    return pieces;
  }, []);
}

export function DialogCelebrationConfetti() {
  const confettiPieces = useConfettiPieces();

  return (
    <div className="dialog-celebration__confetti" aria-hidden="true">
      {confettiPieces.map((piece) => {
        const style: CSSProperties & Record<'--confetti-drift-x' | '--confetti-drift-y' | '--confetti-rotation', string> = {
          top: `${piece.top}%`,
          left: `${piece.left}%`,
          width: `${piece.width}px`,
          height: `${piece.height}px`,
          animationDelay: `${piece.delay}s`,
          animationDuration: `${piece.duration}s`,
          '--confetti-drift-x': `${piece.driftX}px`,
          '--confetti-drift-y': `${piece.driftY}px`,
          '--confetti-rotation': `${piece.rotation}deg`,
          background: piece.background,
        };

        return (
          <span
            key={piece.id}
            className={`dialog-celebration__confetti-piece dialog-celebration__confetti-piece--${piece.edge}`}
            style={style}
          />
        );
      })}
    </div>
  );
}

export default function DialogCelebration({
  title,
  description,
  children,
}: DialogCelebrationProps) {
  return (
    <div className="dialog-celebration">
      <div className="dialog-celebration__body">
        <div className="signup-success">
          <div className="signup-success-icon-wrapper">
            <CheckIcon size={48} className="signup-success-icon" />
          </div>
          <h2 className="signup-success-title">{title}</h2>
          <p className="signup-success-body">{description}</p>
        </div>

        {children ? (
          <div className="dialog-celebration__actions" aria-live="polite">
            {children}
          </div>
        ) : null}
      </div>
    </div>
  );
}

