"use client";

import * as React from "react";
import { AlertCircle, Bell, Check, MoreHorizontal, Plus, Search, Settings, ShoppingCart, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/src/components/ui/accordion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/src/components/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/src/components/ui/alert";
import { AspectRatio } from "@/src/components/ui/aspect-ratio";
import { Avatar, AvatarFallback, AvatarImage } from "@/src/components/ui/avatar";
import { Badge } from "@/src/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/src/components/ui/breadcrumb";
import { Button } from "@/src/components/ui/button";
import { Calendar } from "@/src/components/ui/calendar";
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/src/components/ui/carousel";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/src/components/ui/chart";
import { Checkbox } from "@/src/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/src/components/ui/collapsible";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/src/components/ui/command";
import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/src/components/ui/context-menu";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/src/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/src/components/ui/drawer";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/src/components/ui/form";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/src/components/ui/hover-card";
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from "@/src/components/ui/input-otp";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
} from "@/src/components/ui/menubar";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuIndicator,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  NavigationMenuViewport,
} from "@/src/components/ui/navigation-menu";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/src/components/ui/pagination";
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from "@/src/components/ui/popover";
import { Progress } from "@/src/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/src/components/ui/radio-group";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/src/components/ui/resizable";
import { ScrollArea, ScrollBar } from "@/src/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { Separator } from "@/src/components/ui/separator";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/src/components/ui/sheet";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
} from "@/src/components/ui/sidebar";
import { Skeleton } from "@/src/components/ui/skeleton";
import { Slider } from "@/src/components/ui/slider";
import { Toaster } from "@/src/components/ui/sonner";
import { Switch } from "@/src/components/ui/switch";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/src/components/ui/tabs";
import { Textarea } from "@/src/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/src/components/ui/toggle-group";
import { Toggle } from "@/src/components/ui/toggle";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/src/components/ui/tooltip";
import { toast } from "sonner";

type DemoFormValues = {
  fullName: string;
  note: string;
};

const chartData = [
  { month: "T1", value: 120 },
  { month: "T2", value: 180 },
  { month: "T3", value: 140 },
  { month: "T4", value: 210 },
];

const chartConfig = {
  value: {
    label: "Doanh thu",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

export default function TestAllComponentsPage() {
  const [date, setDate] = React.useState<Date | undefined>(new Date());
  const [switchValue, setSwitchValue] = React.useState(true);
  const [checkboxValue, setCheckboxValue] = React.useState(false);
  const [radioValue, setRadioValue] = React.useState("delivery");
  const [selectValue, setSelectValue] = React.useState("pizza");
  const [sliderValue, setSliderValue] = React.useState([40]);
  const [progressValue, setProgressValue] = React.useState(35);
  const [otpValue, setOtpValue] = React.useState("");
  const [togglePressed, setTogglePressed] = React.useState(false);
  const [toggleGroupValue, setToggleGroupValue] = React.useState("all");
  const [menuRadioValue, setMenuRadioValue] = React.useState("a");
  const [contextRadioValue, setContextRadioValue] = React.useState("new");

  const form = useForm<DemoFormValues>({
    defaultValues: {
      fullName: "",
      note: "",
    },
  });

  const onSubmit = (values: DemoFormValues) => {
    toast.success(`Form submitted: ${values.fullName || "(empty)"}`);
  };

  return (
    <div className="bg-background text-foreground px-4 py-8 md:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Component Test Lab</CardTitle>
            <CardDescription>Trang test tổng hợp cho toàn bộ component trong thư mục ui.</CardDescription>
            <CardAction>
              <Button onClick={() => toast.success("Sonner hoạt động")}>Test Toast</Button>
            </CardAction>
          </CardHeader>
          <CardContent className="space-y-4">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/">Home</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href="/test">Test</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbEllipsis />
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Components</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Gợi ý</AlertTitle>
              <AlertDescription>Dùng tab bên dưới để test từng nhóm component.</AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        <Tabs defaultValue="core" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="core">Core</TabsTrigger>
            <TabsTrigger value="inputs">Inputs</TabsTrigger>
            <TabsTrigger value="overlays">Overlays</TabsTrigger>
            <TabsTrigger value="menus">Menus</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          <TabsContent value="core" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Buttons, Badge, Avatar, Tooltip, HoverCard</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap items-center gap-3">
                <Button>Default</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="destructive">
                  <Trash2 className="mr-1 h-4 w-4" /> Delete
                </Button>
                <Badge>New</Badge>
                <Avatar>
                  <AvatarImage src="https://github.com/shadcn.png" alt="avatar" />
                  <AvatarFallback>PP</AvatarFallback>
                </Avatar>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button size="icon" variant="ghost">
                        <Bell className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Tooltip hoạt động</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <HoverCard>
                  <HoverCardTrigger asChild>
                    <Button variant="link">Hover card</Button>
                  </HoverCardTrigger>
                  <HoverCardContent>Pizza thủ công, nướng lò đá, giao nhanh.</HoverCardContent>
                </HoverCard>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>AspectRatio, Carousel, Skeleton</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="max-w-md overflow-hidden rounded-lg border">
                  <AspectRatio ratio={16 / 9}>
                    <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-orange-300 via-orange-200 to-amber-100 text-lg font-semibold text-orange-900">
                      Aspect Ratio 16:9
                    </div>
                  </AspectRatio>
                </div>

                <Carousel className="w-full max-w-xl">
                  <CarouselContent>
                    {["Pizza", "Pasta", "Drink"].map(item => (
                      <CarouselItem key={item} className="md:basis-1/2">
                        <Card>
                          <CardContent className="flex h-28 items-center justify-center text-lg font-medium">{item}</CardContent>
                        </Card>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious />
                  <CarouselNext />
                </Carousel>

                <div className="space-y-2">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="ghost" onClick={() => setProgressValue(p => Math.min(100, p + 10))}>
                  Tăng Progress demo
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Accordion, Collapsible, Separator</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Accordion type="single" collapsible>
                  <AccordionItem value="faq-1">
                    <AccordionTrigger>Pizza có giao trong 30 phút không?</AccordionTrigger>
                    <AccordionContent>Có, tại khu vực nội thành TP.HCM.</AccordionContent>
                  </AccordionItem>
                </Accordion>
                <Separator />
                <Collapsible>
                  <CollapsibleTrigger asChild>
                    <Button variant="outline">Mở nội dung thêm</Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pt-3 text-sm text-muted-foreground">
                    Đây là phần test của CollapsibleContent.
                  </CollapsibleContent>
                </Collapsible>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="inputs" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Form, Input, Textarea, Label, Select</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-6 md:grid-cols-2">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="fullName"
                      rules={{ required: "Vui lòng nhập tên" }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Họ và tên</FormLabel>
                          <FormControl>
                            <Input placeholder="Nguyen Van A" {...field} />
                          </FormControl>
                          <FormDescription>Nhập tên để test react-hook-form.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="note"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ghi chú</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Them pho mai" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit">Submit form</Button>
                  </form>
                </Form>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Danh mục</Label>
                    <Select value={selectValue} onValueChange={setSelectValue}>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn danh mục" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Món ăn</SelectLabel>
                          <SelectItem value="pizza">Pizza</SelectItem>
                          <SelectItem value="pasta">Pasta</SelectItem>
                          <SelectSeparator />
                          <SelectItem value="drink">Drink</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-3">
                    <Switch checked={switchValue} onCheckedChange={setSwitchValue} />
                    <Label>Nhận thông báo</Label>
                  </div>

                  <div className="flex items-center gap-3">
                    <Checkbox checked={checkboxValue} onCheckedChange={checked => setCheckboxValue(checked === true)} />
                    <Label>Đồng ý điều khoản</Label>
                  </div>

                  <div className="space-y-2">
                    <Label>Hình thức nhận hàng</Label>
                    <RadioGroup value={radioValue} onValueChange={setRadioValue}>
                      <div className="flex items-center gap-2">
                        <RadioGroupItem id="delivery" value="delivery" />
                        <Label htmlFor="delivery">Delivery</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <RadioGroupItem id="pickup" value="pickup" />
                        <Label htmlFor="pickup">Pickup</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>InputOTP, Slider, Progress, Calendar</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <Label>Mã OTP</Label>
                  <InputOTP maxLength={6} value={otpValue} onChange={setOtpValue}>
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                    </InputOTPGroup>
                    <InputOTPSeparator />
                    <InputOTPGroup>
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>

                  <div className="space-y-2">
                    <Label>Slider</Label>
                    <Slider value={sliderValue} onValueChange={setSliderValue} max={100} step={1} />
                    <div className="text-sm text-muted-foreground">Giá trị: {sliderValue[0]}</div>
                  </div>

                  <div className="space-y-2">
                    <Label>Progress</Label>
                    <Progress value={progressValue} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Calendar</Label>
                  <Calendar mode="single" selected={date} onSelect={setDate} className="rounded-md border" />
                  <div className="text-sm text-muted-foreground">
                    Ngày đã chọn: {date ? date.toLocaleDateString("vi-VN") : "Chưa chọn"}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="overlays" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Dialog, AlertDialog, Sheet, Drawer, Popover</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-3">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>Open Dialog</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Xác nhận thao tác</DialogTitle>
                      <DialogDescription>Đây là demo dialog component.</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                      </DialogClose>
                      <Button onClick={() => toast.success("Dialog confirmed")}>Confirm</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">Open Alert Dialog</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Bạn chắc chắn muốn xóa?</AlertDialogTitle>
                      <AlertDialogDescription>Hành động này không thể hoàn tác.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Hủy</AlertDialogCancel>
                      <AlertDialogAction onClick={() => toast.success("Đã xóa")}>Xóa</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline">Open Sheet</Button>
                  </SheetTrigger>
                  <SheetContent>
                    <SheetHeader>
                      <SheetTitle>Sheet title</SheetTitle>
                      <SheetDescription>Demo Sheet component.</SheetDescription>
                    </SheetHeader>
                    <SheetFooter className="mt-6">
                      <SheetClose asChild>
                        <Button>Done</Button>
                      </SheetClose>
                    </SheetFooter>
                  </SheetContent>
                </Sheet>

                <Drawer>
                  <DrawerTrigger asChild>
                    <Button variant="secondary">Open Drawer</Button>
                  </DrawerTrigger>
                  <DrawerContent>
                    <DrawerHeader>
                      <DrawerTitle>Drawer từ dưới lên</DrawerTitle>
                      <DrawerDescription>Demo mobile drawer.</DrawerDescription>
                    </DrawerHeader>
                    <DrawerFooter>
                      <DrawerClose asChild>
                        <Button variant="outline">Đóng</Button>
                      </DrawerClose>
                    </DrawerFooter>
                  </DrawerContent>
                </Drawer>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline">Open Popover</Button>
                  </PopoverTrigger>
                  <PopoverAnchor className="absolute" />
                  <PopoverContent>
                    <p className="text-sm">PopoverContent đã render thành công.</p>
                  </PopoverContent>
                </Popover>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Command + ScrollArea + Resizable</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <Command className="rounded-lg border">
                  <CommandInput placeholder="Tìm menu..." />
                  <CommandList>
                    <CommandEmpty>Không có kết quả</CommandEmpty>
                    <CommandGroup heading="Gợi ý">
                      <CommandItem>
                        <Search className="mr-2 h-4 w-4" /> Pizza hải sản
                        <CommandShortcut>⌘P</CommandShortcut>
                      </CommandItem>
                      <CommandItem>
                        <ShoppingCart className="mr-2 h-4 w-4" /> Giỏ hàng
                        <CommandShortcut>⌘K</CommandShortcut>
                      </CommandItem>
                    </CommandGroup>
                    <CommandSeparator />
                    <CommandGroup heading="Cài đặt">
                      <CommandItem>
                        <Settings className="mr-2 h-4 w-4" /> Cấu hình
                      </CommandItem>
                    </CommandGroup>
                  </CommandList>
                </Command>

                <ResizablePanelGroup orientation="horizontal" className="min-h-55 rounded-lg border">
                  <ResizablePanel defaultSize={45}>
                    <ScrollArea className="h-55 rounded-l-lg p-4">
                      {Array.from({ length: 20 }).map((_, idx) => (
                        <div key={idx} className="py-1 text-sm">
                          Dòng nội dung {idx + 1}
                        </div>
                      ))}
                      <ScrollBar orientation="vertical" />
                    </ScrollArea>
                  </ResizablePanel>
                  <ResizableHandle withHandle />
                  <ResizablePanel defaultSize={55}>
                    <div className="flex h-55 items-center justify-center text-muted-foreground">Panel bên phải</div>
                  </ResizablePanel>
                </ResizablePanelGroup>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="menus" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>DropdownMenu, ContextMenu, Menubar, NavigationMenu</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-wrap gap-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline">Dropdown</Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <DropdownMenuLabel>Tác vụ</DropdownMenuLabel>
                      <DropdownMenuItem>
                        Tạo mới <DropdownMenuShortcut>⌘N</DropdownMenuShortcut>
                      </DropdownMenuItem>
                      <DropdownMenuCheckboxItem checked>Hiển thị badge</DropdownMenuCheckboxItem>
                      <DropdownMenuRadioGroup value={menuRadioValue} onValueChange={setMenuRadioValue}>
                        <DropdownMenuRadioItem value="a">Option A</DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="b">Option B</DropdownMenuRadioItem>
                      </DropdownMenuRadioGroup>
                      <DropdownMenuSeparator />
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger>More</DropdownMenuSubTrigger>
                        <DropdownMenuSubContent>
                          <DropdownMenuItem>Sub item</DropdownMenuItem>
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <ContextMenu>
                    <ContextMenuTrigger className="rounded-md border px-4 py-2 text-sm">
                      Click chuột phải vào đây
                    </ContextMenuTrigger>
                    <ContextMenuContent>
                      <ContextMenuLabel>Context menu</ContextMenuLabel>
                      <ContextMenuItem>
                        Copy <ContextMenuShortcut>⌘C</ContextMenuShortcut>
                      </ContextMenuItem>
                      <ContextMenuCheckboxItem checked>Ghim mục này</ContextMenuCheckboxItem>
                      <ContextMenuSeparator />
                      <ContextMenuRadioGroup value={contextRadioValue} onValueChange={setContextRadioValue}>
                        <ContextMenuRadioItem value="new">Mới nhất</ContextMenuRadioItem>
                        <ContextMenuRadioItem value="popular">Phổ biến</ContextMenuRadioItem>
                      </ContextMenuRadioGroup>
                      <ContextMenuSub>
                        <ContextMenuSubTrigger>Nâng cao</ContextMenuSubTrigger>
                        <ContextMenuSubContent>
                          <ContextMenuItem>Thông tin</ContextMenuItem>
                        </ContextMenuSubContent>
                      </ContextMenuSub>
                    </ContextMenuContent>
                  </ContextMenu>
                </div>

                <Menubar>
                  <MenubarMenu>
                    <MenubarTrigger>File</MenubarTrigger>
                    <MenubarContent>
                      <MenubarItem>
                        New <MenubarShortcut>⌘N</MenubarShortcut>
                      </MenubarItem>
                      <MenubarSeparator />
                      <MenubarSub>
                        <MenubarSubTrigger>Export</MenubarSubTrigger>
                        <MenubarSubContent>
                          <MenubarItem>PDF</MenubarItem>
                        </MenubarSubContent>
                      </MenubarSub>
                    </MenubarContent>
                  </MenubarMenu>
                </Menubar>

                <NavigationMenu>
                  <NavigationMenuList>
                    <NavigationMenuItem>
                      <NavigationMenuTrigger>Menu chính</NavigationMenuTrigger>
                      <NavigationMenuContent>
                        <ul className="grid w-[320px] gap-2 p-3">
                          <li>
                            <NavigationMenuLink className="rounded-md p-2 hover:bg-accent">Pizza bán chạy</NavigationMenuLink>
                          </li>
                          <li>
                            <NavigationMenuLink className="rounded-md p-2 hover:bg-accent">Combo gia đình</NavigationMenuLink>
                          </li>
                        </ul>
                      </NavigationMenuContent>
                    </NavigationMenuItem>
                  </NavigationMenuList>
                  <NavigationMenuIndicator />
                  <NavigationMenuViewport />
                </NavigationMenu>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pagination + Table</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <Table>
                  <TableCaption>Danh sách món demo</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Món</TableHead>
                      <TableHead>Giá</TableHead>
                      <TableHead>Trạng thái</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>Pepperoni</TableCell>
                      <TableCell>170.000đ</TableCell>
                      <TableCell>
                        <Badge>Available</Badge>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Seafood</TableCell>
                      <TableCell>195.000đ</TableCell>
                      <TableCell>
                        <Badge variant="secondary">Low stock</Badge>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell>Tổng</TableCell>
                      <TableCell>365.000đ</TableCell>
                      <TableCell>2 items</TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>

                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious href="#" />
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationLink href="#" isActive>
                        1
                      </PaginationLink>
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationLink href="#">2</PaginationLink>
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationNext href="#" />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Chart + Toggle + ToggleGroup</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <ChartContainer config={chartConfig} className="h-70 w-full">
                  <BarChart data={chartData}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <ChartLegend
                      content={props => <ChartLegendContent payload={props.payload} verticalAlign={props.verticalAlign} />}
                    />
                    <Bar dataKey="value" fill="var(--color-value)" radius={8} />
                  </BarChart>
                </ChartContainer>

                <div className="flex flex-wrap items-center gap-3">
                  <Toggle pressed={togglePressed} onPressedChange={setTogglePressed}>
                    <Check className="mr-1 h-4 w-4" /> Toggle
                  </Toggle>
                  <ToggleGroup type="single" value={toggleGroupValue} onValueChange={v => v && setToggleGroupValue(v)}>
                    <ToggleGroupItem value="all">All</ToggleGroupItem>
                    <ToggleGroupItem value="pizza">Pizza</ToggleGroupItem>
                    <ToggleGroupItem value="drink">Drink</ToggleGroupItem>
                  </ToggleGroup>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sidebar Component Demo</CardTitle>
                <CardDescription>Demo mini sidebar với đầy đủ phần tử chính của sidebar.tsx.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-hidden rounded-lg border">
                  <SidebarProvider>
                    <div className="flex min-h-90 w-full">
                      <Sidebar collapsible="icon" variant="inset">
                        <SidebarHeader>
                          <SidebarInput placeholder="Search..." />
                        </SidebarHeader>

                        <SidebarContent>
                          <SidebarGroup>
                            <SidebarGroupLabel>Quản lý</SidebarGroupLabel>
                            <SidebarGroupAction>
                              <Plus className="h-4 w-4" />
                            </SidebarGroupAction>
                            <SidebarGroupContent>
                              <SidebarMenu>
                                <SidebarMenuItem>
                                  <SidebarMenuButton asChild>
                                    <a href="#">
                                      <ShoppingCart />
                                      <span>Đơn hàng</span>
                                    </a>
                                  </SidebarMenuButton>
                                  <SidebarMenuBadge>12</SidebarMenuBadge>
                                  <SidebarMenuAction>
                                    <MoreHorizontal className="h-4 w-4" />
                                  </SidebarMenuAction>
                                </SidebarMenuItem>
                                <SidebarMenuItem>
                                  <SidebarMenuButton asChild>
                                    <a href="#">
                                      <Settings />
                                      <span>Cài đặt</span>
                                    </a>
                                  </SidebarMenuButton>
                                </SidebarMenuItem>
                              </SidebarMenu>

                              <SidebarSeparator />

                              <SidebarMenuSub>
                                <SidebarMenuSubItem>
                                  <SidebarMenuSubButton href="#">Chi nhánh 1</SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                                <SidebarMenuSubItem>
                                  <SidebarMenuSubButton href="#">Chi nhánh 2</SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              </SidebarMenuSub>

                              <div className="p-2">
                                <SidebarMenuSkeleton showIcon />
                              </div>
                            </SidebarGroupContent>
                          </SidebarGroup>
                        </SidebarContent>

                        <SidebarFooter>
                          <SidebarMenu>
                            <SidebarMenuItem>
                              <SidebarMenuButton asChild>
                                <a href="#">
                                  <Avatar className="h-5 w-5">
                                    <AvatarFallback>AD</AvatarFallback>
                                  </Avatar>
                                  <span>Admin</span>
                                </a>
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                          </SidebarMenu>
                        </SidebarFooter>

                        <SidebarRail />
                      </Sidebar>

                      <SidebarInset>
                        <div className="flex items-center gap-2 border-b p-3">
                          <SidebarTrigger />
                          <span className="text-sm font-medium">Nội dung chính</span>
                        </div>
                        <div className="p-4 text-sm text-muted-foreground">
                          SidebarInset area để test layout khi sidebar expand/collapse.
                        </div>
                      </SidebarInset>
                    </div>
                  </SidebarProvider>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Toaster
        toastOptions={{
          classNames: {
            success: "bg-green-500! text-white! border-green-600!",
            error: "bg-red-500! text-white! border-red-600!",
            warning: "bg-yellow-500! text-white! border-yellow-600!",
            toast: "bg-gray-800! text-white!",
          },
        }}
      />
    </div>
  );
}
