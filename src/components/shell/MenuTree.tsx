"use client";
import Link from "next/link";
import { useState } from "react";
import cx from "classnames";
import { MenuNode } from "@/stores/menuStore";

function NodeItem({ node, pathname, level, collapsed }: { node: MenuNode; pathname: string; level: number; collapsed: boolean }) {
  const [open, setOpen] = useState(level < 1);
  const hasChildren = (node.children?.length ?? 0) > 0;
  const active = node.path && pathname === node.path;
  const pad = collapsed ? 0 : Math.min(30, level * 12);

  return (
    <div>
      <div className={cx("flex items-center justify-between rounded-lg", active ? "bg-black/5 dark:bg-white/10" : "hover:bg-black/5 dark:hover:bg-white/10")}>
        {node.path ? (
          <Link href={node.path} className="flex-1 px-3 py-2 text-sm truncate" style={{ paddingLeft: collapsed ? 12 : 12 + pad }} title={node.name}>
            {collapsed ? (node.icon ?? "•") : node.name}
          </Link>
        ) : (
          <button className="flex-1 text-left px-3 py-2 text-sm truncate" style={{ paddingLeft: collapsed ? 12 : 12 + pad }} onClick={() => setOpen((v) => !v)} title={node.name}>
            {collapsed ? (node.icon ?? "•") : node.name}
          </button>
        )}
        {hasChildren && !collapsed && (
          <button className="px-2 py-2 text-xs text-[rgb(var(--muted))]" onClick={() => setOpen((v) => !v)} aria-label="Toggle">
            {open ? "▾" : "▸"}
          </button>
        )}
      </div>

      {hasChildren && open && (
        <div className="mt-1">
          {node.children!.map((c) => (
            <NodeItem key={c.id} node={c} pathname={pathname} level={level + 1} collapsed={collapsed} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function MenuTree({ nodes, pathname, collapsed }: { nodes: MenuNode[]; pathname: string; collapsed: boolean }) {
  return <div className="space-y-1">{nodes.map((n) => <NodeItem key={n.id} node={n} pathname={pathname} level={0} collapsed={collapsed} />)}</div>;
}
