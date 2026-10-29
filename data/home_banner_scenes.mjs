/** Homepage demo banner content. Each slide presents an application scene. */
export const BANNERS = [
  {
    // Retain existing keys so a saved demo can be updated in place without duplicate slides.
    key: 'banner-circular',
    label: '工业自动化解决方案',
    sort: 10,
    image: '/images/marketing/home-solution-automation.jpg',
    link_path: '/solutions',
    en: { tag: 'Industrial automation', title: 'Reliable connections across the automated factory.', text: 'From control cabinets to equipment on the production floor, connect power, signals and data with confidence.', cta: 'Explore automation solutions' },
    zh: { tag: '工业自动化解决方案', title: '连接工业现场，助力自动化运行。', text: '从控制柜到生产设备，让电力、信号与数据在复杂现场稳定连接。', cta: '探索自动化方案' },
  },
  {
    key: 'banner-energy',
    label: '光伏与储能解决方案',
    sort: 20,
    image: '/images/marketing/home-solution-energy.jpg',
    link_path: '/solutions',
    en: { tag: 'Photovoltaic and energy storage', title: 'Connect the next chapter of energy.', text: 'Explore connection solutions across solar generation, energy storage and charging applications.', cta: 'Explore energy solutions' },
    zh: { tag: '光伏与储能解决方案', title: '连接新能源的更多应用场景。', text: '从光伏发电到储能和充电，探索贯穿能源系统的连接方案。', cta: '探索能源方案' },
  },
  {
    key: 'banner-push',
    label: '轨道交通解决方案',
    sort: 30,
    image: '/images/marketing/home-solution-rail.jpg',
    link_path: '/solutions',
    en: { tag: 'Rail transit', title: 'Connections that travel with the system.', text: 'Explore connectivity for onboard equipment, control systems and trackside applications.', cta: 'Explore rail solutions' },
    zh: { tag: '轨道交通解决方案', title: '让可靠连接，贯穿轨道交通系统。', text: '探索车载设备、控制系统与轨旁场景中的连接应用。', cta: '探索轨道方案' },
  },
];
