import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { goBackInApp } from '@/lib/listNavigation';

const BackLink = ({
  fallback = '/browse',
  label = 'Retour',
  className = 'inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-cyan-300 transition-colors mb-6',
  testId = 'back-link'
}) => {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      className={className}
      onClick={() => goBackInApp(navigate, fallback)}
      data-testid={testId}
    >
      <ArrowLeft className="w-4 h-4" />
      {label}
    </button>
  );
};

export default BackLink;
