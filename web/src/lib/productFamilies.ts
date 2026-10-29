/** Demo-only product-family map for the header mega menu and /products. Not a CMS model. */

export const PRODUCT_FAMILIES = [
  {
    id: "terminal-blocks",
    path: "/product/category/terminal-blocks",
    image: "/images/marketing/home-product-1.png",
    contain: true,
    zh: { name: "接线端子", text: "柜内回路与设备配线", action: "筛选端子系列" },
    en: { name: "Terminal blocks", text: "Cabinet and internal wiring", action: "Browse terminal series" },
    children: [
      { path: "/product/category/pcb-plug", zhPath: "/product/category/pcb-cha-tou", zh: "PCB 插头", en: "PCB plugs" },
      { path: "/product/category/pcb-socket", zhPath: "/product/category/pcb-cha-zuo", zh: "PCB 插座", en: "PCB sockets" },
      { path: "/product/category/din-rail-panel-mounting-connector", zhPath: "/product/category/dao-gui-mian-ban-an-zhuang-lian-jie-qi", zh: "导轨 / 面板安装连接器", en: "DIN-rail / panel connectors" },
    ],
  },
  {
    id: "circular-connectors",
    path: "/product/category/circular-connectors",
    image: "/images/marketing/circular-connectors.jpg",
    contain: false,
    zh: { name: "圆形连接器", text: "设备端与现场接口", action: "了解产品族" },
    en: { name: "Circular connectors", text: "Device and field interfaces", action: "Explore the family" },
    children: [],
  },
  {
    id: "heavy-duty",
    path: "/solutions#automation",
    image: "/images/marketing/home-banner-heavy-duty.jpg",
    contain: false,
    zh: { name: "重载连接器", text: "设备模块与组合接口", action: "查看应用方向" },
    en: { name: "Heavy-duty connectors", text: "Machine modules and combined interfaces", action: "Explore applications" },
    children: [],
  },
  {
    id: "energy",
    path: "/solutions#energy",
    image: "/images/marketing/home-banner-energy.jpg",
    contain: false,
    zh: { name: "能源连接器", text: "能源设备的功率连接", action: "了解能源应用" },
    en: { name: "Energy connectors", text: "Power connections for energy equipment", action: "Explore energy applications" },
    children: [],
  },
] as const;
