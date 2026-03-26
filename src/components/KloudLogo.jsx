import React from 'react';

import { cn } from '@/lib/utils';

// Simple cloud mark inspired by provided logo (stroke-only).
const KloudLogo = ({ className, title = 'Kloud', ...props }) => (
  <svg
    viewBox="0 0 128 128"
    role="img"
    aria-label={title}
    className={cn('block', className)}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M34 86c-10 0-18-7-18-17 0-8 5-15 13-17 2-14 14-24 29-24 11 0 21 6 26 15 2-1 5-1 7-1 12 0 21 9 21 21 0 12-9 23-22 23H34Z"
      stroke="currentColor"
      strokeWidth="6"
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity="0.95"
    />
    <path
      d="M38 86c-9 0-16-6-16-15 0-7 4-13 12-15 1-12 12-21 25-21 10 0 18 5 22 13 2-1 4-1 6-1 10 0 18 8 18 18 0 10-8 21-20 21H38Z"
      stroke="currentColor"
      strokeWidth="3.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity="0.65"
    />
    <path
      d="M42 86c-8 0-14-5-14-13 0-6 4-11 10-13 1-10 10-18 21-18 8 0 15 4 19 11 2-1 3-1 5-1 8 0 15 7 15 15 0 9-7 19-18 19H42Z"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity="0.45"
    />
  </svg>
);

export default KloudLogo;

