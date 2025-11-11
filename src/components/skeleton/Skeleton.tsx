import { Skeleton as RadixSkeleton } from '@radix-ui/themes';
import clsx from 'clsx';
import type { ComponentPropsWithoutRef } from 'react';
import './skeleton.scss';

export type SkeletonProps = ComponentPropsWithoutRef<typeof RadixSkeleton>;

export default function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <RadixSkeleton
      className={clsx('app-skeleton', className)}
      {...props}
    />
  );
}
