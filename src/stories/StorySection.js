import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export default function StorySection({
  id,
  title,
  description,
  children,
  right
}) {
  return (
    <section id={id} className="scroll-mt-28">
      <div className="flex items-start justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
              {title}
            </h2>
            <Badge className="bg-white/5 border border-white/10 text-muted-foreground">
              {id}
            </Badge>
          </div>
          {description ? (
            <p className="text-muted-foreground max-w-3xl">{description}</p>
          ) : null}
        </div>
        {right ? <div className="shrink-0">{right}</div> : null}
      </div>

      <div className="mt-6">{children}</div>
      <Separator className="my-10 bg-white/10" />
    </section>
  );
}

