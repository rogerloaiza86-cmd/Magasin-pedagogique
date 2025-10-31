"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import type { Article } from "@/lib/types"

interface ArticleComboboxProps {
  articles: Article[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function ArticleCombobox({ articles, value, onChange, disabled }: ArticleComboboxProps) {
  const [open, setOpen] = React.useState(false);

  const handleSelect = (currentValue: string) => {
    onChange(currentValue === value ? "" : currentValue);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          {value
            ? articles.find((article) => article.id === value)?.name ?? "Sélectionner un article..."
            : "Sélectionner un article..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DialogTrigger>
      <DialogContent className="p-0">
        <DialogHeader>
          <DialogTitle className="sr-only">Sélectionner un article</DialogTitle>
        </DialogHeader>
        <Command>
          <CommandInput placeholder="Rechercher un article..." />
          <CommandList>
            <CommandEmpty>Aucun article trouvé.</CommandEmpty>
            <CommandGroup>
              {articles.map((article) => (
                <CommandItem
                  key={article.id}
                  value={article.id}
                  onSelect={handleSelect}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === article.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {article.name} ({article.id}) - Stock: {article.stock}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
