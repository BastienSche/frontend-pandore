import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { Toaster } from '@/components/ui/toaster';
import { toast } from '@/hooks/use-toast';

export function UiComponentsStories() {
  const [progress, setProgress] = useState(55);
  const [checked, setChecked] = useState(true);
  const [enabled, setEnabled] = useState(true);
  const [slider, setSlider] = useState([35]);
  const [text, setText] = useState('Pandore UI');
  const [date, setDate] = useState(() => new Date());

  const tableRows = useMemo(
    () => [
      { name: 'TrackCard', type: 'Card', status: 'Used' },
      { name: 'AlbumCard', type: 'Card', status: 'Used' },
      { name: 'Navbar', type: 'Navigation', status: 'Used' },
      { name: 'Button', type: 'Primitive', status: 'Used' }
    ],
    []
  );

  return (
    <div className="space-y-10">
      <TooltipProvider>
        <Toaster />

        <div className="glass-heavy rounded-3xl p-6 border border-white/10">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-purple-500/10 text-purple-300 border-purple-500/20">
              UI primitives
            </Badge>
            <Badge className="bg-white/5 border-white/10 text-muted-foreground">
              controls
            </Badge>
          </div>
          <div className="mt-2 text-sm text-muted-foreground">
            Cette section regroupe les composants de `src/components/ui/*` (Radix/shadcn).
            Les contrôles ci-dessous modifient les props en live.
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="glass-heavy border-white/10 rounded-3xl">
            <CardHeader>
              <CardTitle>Buttons & Badges</CardTitle>
              <CardDescription>Variants, tailles, états.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <Button>Default</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="destructive">Destructive</Button>
                <Button variant="ghost">Ghost</Button>
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                <Badge>Badge</Badge>
                <Badge variant="secondary">Secondary</Badge>
                <Badge variant="destructive">Destructive</Badge>
                <Badge variant="outline">Outline</Badge>
              </div>
              <Separator className="bg-white/10" />
              <div className="flex items-center gap-3">
                <Switch checked={enabled} onCheckedChange={setEnabled} />
                <span className="text-sm text-muted-foreground">Enabled</span>
              </div>
              <div className="flex gap-3">
                <Button disabled={!enabled}>Action</Button>
                <Button variant="outline" disabled={!enabled}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-heavy border-white/10 rounded-3xl">
            <CardHeader>
              <CardTitle>Inputs</CardTitle>
              <CardDescription>Input, textarea, checkbox, switch, slider.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Text</Label>
                <Input value={text} onChange={(e) => setText(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Textarea</Label>
                <Textarea placeholder="Type..." />
              </div>
              <div className="flex items-center gap-3">
                <Checkbox checked={checked} onCheckedChange={setChecked} />
                <span className="text-sm text-muted-foreground">
                  Checked: {String(checked)}
                </span>
              </div>
              <div className="space-y-2">
                <Label>Slider ({slider?.[0] ?? 0})</Label>
                <Slider value={slider} onValueChange={setSlider} min={0} max={100} step={1} />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-heavy border-white/10 rounded-3xl">
            <CardHeader>
              <CardTitle>Feedback</CardTitle>
              <CardDescription>Progress, alert, toast, skeleton.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-mono">{progress}%</span>
                </div>
                <Progress value={progress} />
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setProgress((p) => Math.max(0, p - 10))}>
                    -10
                  </Button>
                  <Button variant="outline" onClick={() => setProgress((p) => Math.min(100, p + 10))}>
                    +10
                  </Button>
                </div>
              </div>

              <Alert className="border-white/10 bg-white/5">
                <AlertTitle>Alert</AlertTitle>
                <AlertDescription>
                  Composant de feedback (info/warn) dans le style de l’app.
                </AlertDescription>
              </Alert>

              <div className="flex items-center gap-3">
                <Button
                  onClick={() =>
                    toast({
                      title: 'Toast',
                      description: 'Demo toast depuis le UI kit.'
                    })
                  }
                >
                  Trigger toast
                </Button>
                <Skeleton className="h-10 w-24 rounded-xl" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="glass-heavy border-white/10 rounded-3xl">
            <CardHeader>
              <CardTitle>Overlays</CardTitle>
              <CardDescription>Tooltip, hover card, popover, dialog, sheet, drawer.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3 items-center">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline">Tooltip</Button>
                </TooltipTrigger>
                <TooltipContent>Tooltip content</TooltipContent>
              </Tooltip>

              <HoverCard>
                <HoverCardTrigger asChild>
                  <Button variant="outline">HoverCard</Button>
                </HoverCardTrigger>
                <HoverCardContent className="glass-heavy border-white/10">
                  <div className="text-sm font-medium">Hover card</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Petit panneau au survol.
                  </div>
                </HoverCardContent>
              </HoverCard>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline">Popover</Button>
                </PopoverTrigger>
                <PopoverContent className="glass-heavy border-white/10">
                  Popover content
                </PopoverContent>
              </Popover>

              <Dialog>
                <DialogTrigger asChild>
                  <Button>Dialog</Button>
                </DialogTrigger>
                <DialogContent className="glass-heavy border-white/10">
                  <DialogHeader>
                    <DialogTitle>Dialog title</DialogTitle>
                    <DialogDescription>Dialog description</DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="outline">Cancel</Button>
                    <Button>Confirm</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline">Sheet</Button>
                </SheetTrigger>
                <SheetContent className="glass-heavy border-white/10">
                  <SheetHeader>
                    <SheetTitle>Sheet title</SheetTitle>
                    <SheetDescription>Sheet description</SheetDescription>
                  </SheetHeader>
                </SheetContent>
              </Sheet>

              <Drawer>
                <DrawerTrigger asChild>
                  <Button variant="outline">Drawer</Button>
                </DrawerTrigger>
                <DrawerContent className="glass-heavy border-white/10">
                  <DrawerHeader>
                    <DrawerTitle>Drawer title</DrawerTitle>
                    <DrawerDescription>Drawer description</DrawerDescription>
                  </DrawerHeader>
                  <div className="p-4 pt-0">
                    <Button variant="outline">Close</Button>
                  </div>
                </DrawerContent>
              </Drawer>
            </CardContent>
          </Card>

          <Card className="glass-heavy border-white/10 rounded-3xl">
            <CardHeader>
              <CardTitle>Data display</CardTitle>
              <CardDescription>Tabs, table, scroll area, avatar, calendar, select.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src="https://picsum.photos/seed/pandore-avatar/200/200" />
                  <AvatarFallback>PD</AvatarFallback>
                </Avatar>
                <div className="text-sm">
                  <div className="font-medium">Avatar</div>
                  <div className="text-muted-foreground">Image + fallback</div>
                </div>
              </div>

              <Tabs defaultValue="table">
                <TabsList className="bg-white/5 border border-white/10">
                  <TabsTrigger value="table">Table</TabsTrigger>
                  <TabsTrigger value="calendar">Calendar</TabsTrigger>
                  <TabsTrigger value="select">Select</TabsTrigger>
                </TabsList>
                <TabsContent value="table" className="mt-4">
                  <ScrollArea className="h-52 rounded-2xl border border-white/10">
                    <Table>
                      <TableCaption>Mini registry des composants.</TableCaption>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {tableRows.map((row) => (
                          <TableRow key={row.name}>
                            <TableCell className="font-medium">{row.name}</TableCell>
                            <TableCell>{row.type}</TableCell>
                            <TableCell>{row.status}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </TabsContent>
                <TabsContent value="calendar" className="mt-4">
                  <div className="rounded-2xl border border-white/10 p-3 bg-white/5">
                    <Calendar mode="single" selected={date} onSelect={setDate} />
                  </div>
                </TabsContent>
                <TabsContent value="select" className="mt-4">
                  <Select defaultValue="pandore">
                    <SelectTrigger className="bg-white/5 border-white/10">
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent className="glass-heavy border-white/10">
                      <SelectItem value="pandore">Pandore</SelectItem>
                      <SelectItem value="music">Music</SelectItem>
                      <SelectItem value="artist">Artist</SelectItem>
                    </SelectContent>
                  </Select>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        <Card className="glass-heavy border-white/10 rounded-3xl">
          <CardHeader>
            <CardTitle>Accordion</CardTitle>
            <CardDescription>Composant d’organisation de contenu.</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible>
              <AccordionItem value="item-1">
                <AccordionTrigger>Qu’est-ce que ce UI kit ?</AccordionTrigger>
                <AccordionContent>
                  Une page de démo interne qui affiche tous les composants réutilisables.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger>Pourquoi pas Storybook ?</AccordionTrigger>
                <AccordionContent>
                  Ici on garde le thème exact de l’app, sans serveur/tooling séparé.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      </TooltipProvider>
    </div>
  );
}

