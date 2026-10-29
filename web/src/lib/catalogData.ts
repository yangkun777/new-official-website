import { getCategoryBySlug, getSeriesByCategory } from "@/lib/repo";
import { catalogImage } from "@/lib/catalogAssets";
import type { Lang } from "@/lib/lang";
import type { CatalogGroup, CatalogSeries } from "@/lib/catalogTypes";

const GROUPS = [
  { slug: "pcb-plug", zh: "PCB 插头", en: "PCB plugs" },
  { slug: "pcb-socket", zh: "PCB 插座", en: "PCB sockets" },
  { slug: "din-rail-panel-mounting-connector", zh: "导轨 / 面板安装连接器", en: "DIN-rail / panel connectors" },
] as const;

export async function getCatalogSeries(lang: Lang): Promise<{ groups: CatalogGroup[]; items: CatalogSeries[] }> {
  const results = (await Promise.all(GROUPS.map(async group => {
    const found = await getCategoryBySlug(group.slug, lang);
    if (!found || !found.availableLangs.includes(lang)) return null;
    const { items } = await getSeriesByCategory(found.category.id, 1, lang, 200);
    return {
      group: { slug: group.slug, name: group[lang] },
      items: items.map(item => ({
        ...item,
        image: catalogImage(item.image),
        categorySlug: group.slug,
        categoryName: group[lang],
      })),
    };
  }))).filter((result): result is NonNullable<typeof result> => result !== null);
  // Alternate product types so the opening view shows the breadth of the catalog.
  const items = Array.from({ length: Math.max(0, ...results.map(result => result.items.length)) }, (_, index) => results.flatMap(result => result.items[index] ? [result.items[index]] : [])).flat();
  return { groups: results.map(result => result.group), items };
}
