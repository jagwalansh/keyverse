import { useState } from "react";
import { Palette, Check, Sparkles } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MONKEYTYPE_THEMES, useTheme, type MonkeytypeTheme, type CaretStyle } from "@/lib/theme-context";

export function ThemePicker() {
  const { theme, setTheme, caretStyle, setCaretStyle } = useTheme();

  const caretStyles: { id: CaretStyle; label: string }[] = [
    { id: "line", label: "Line" },
    { id: "block", label: "Block" },
    { id: "underline", label: "Underline" },
    { id: "off", label: "Hidden" },
  ];

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex h-8 items-center gap-1.5 rounded-md border border-border/60 bg-secondary/30 hover:bg-secondary/70 px-2.5 text-xs text-muted-foreground hover:text-foreground transition-all cursor-pointer shadow-xs"
          title="Monkeytype Themes & Caret"
          aria-label="Change Theme"
        >
          <Palette className="h-3.5 w-3.5 text-primary shrink-0" />
          <span className="hidden xl:inline text-[11px] font-mono capitalize">
            {theme.replace("-", " ")}
          </span>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56 font-mono text-xs p-1.5">
        <DropdownMenuLabel className="flex items-center justify-between text-[10px] uppercase tracking-wider text-muted-foreground px-2 py-1">
          <span>Themes</span>
          <Sparkles className="h-3 w-3 text-primary" />
        </DropdownMenuLabel>
        
        <div className="space-y-0.5 my-1">
          {MONKEYTYPE_THEMES.map((t) => {
            const isSelected = theme === t.id;
            return (
              <DropdownMenuItem
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={`flex items-center justify-between px-2.5 py-1.5 rounded-md cursor-pointer transition-colors ${
                  isSelected
                    ? "bg-secondary font-bold text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {/* Theme Color Preview Dots (Monkeytype style) */}
                  <div
                    className="flex items-center -space-x-1 p-0.5 rounded border border-border/80"
                    style={{ backgroundColor: t.bgColor }}
                  >
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: t.textColor }}
                    />
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: t.accentColor }}
                    />
                  </div>
                  <span className="text-xs">{t.name}</span>
                </div>
                {isSelected && <Check className="h-3.5 w-3.5 text-primary" />}
              </DropdownMenuItem>
            );
          })}
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground px-2 py-1">
          Caret Style
        </DropdownMenuLabel>

        <div className="grid grid-cols-2 gap-1 px-1 py-1">
          {caretStyles.map((c) => (
            <button
              key={c.id}
              onClick={() => setCaretStyle(c.id)}
              className={`px-2 py-1 text-[11px] rounded border transition-all cursor-pointer flex items-center justify-center ${
                caretStyle === c.id
                  ? "border-primary bg-primary/15 text-primary font-bold"
                  : "border-border/60 text-muted-foreground hover:text-foreground hover:border-border"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
