
"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import type { Article } from "@/lib/types"
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export function ArticleCombobox({ articles, value, onSelect, placeholder, disabled = false, disableZeroStock = true }: { articles: Article[], value: string, onSelect: (value: string) => void, placeholder?: string, disabled?: boolean, disableZeroStock?: boolean }) {
    const [open, setOpen] = React.useState(false);
    const selectedArticle = articles.find(a => a.id === value);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between"
                    disabled={disabled}
                >
                    {selectedArticle
                        ? `${selectedArticle.name} (${selectedArticle.id})`
                        : placeholder || "Sélectionner un article..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" style={{width: "var(--radix-popover-trigger-width)"}}>
                <Command>
                    <CommandInput placeholder="Rechercher par référence ou désignation..." />
                    <CommandList>
                        <CommandEmpty>Aucun article trouvé.</CommandEmpty>
                        <CommandGroup>
                            {articles.map((article) => (
                                <CommandItem
                                    key={article.id}
                                    value={`${article.id} ${article.name}`}
                                    onSelect={() => {
                                        onSelect(article.id === value ? "" : article.id)
                                        setOpen(false)
                                    }}
                                    disabled={disableZeroStock && article.stock <= 0}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value === article.id ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    <div>
                                        <p className="font-medium">{article.name}</p>
                                        <p className="text-xs text-muted-foreground">{article.id} - Stock: {article.stock}</p>
                                    </div>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
