"use client"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export type SortOption = "newest" | "oldest" | "most-interested"
export type TokenFilter = "all" | "zUSDC" | "zUSDT"

interface OrderFiltersProps {
  onSortChange: (sort: SortOption) => void
  onTokenFilterChange: (filter: TokenFilter) => void
  currentSort: SortOption
  currentFilter: TokenFilter
}

export default function OrderFilters({
  onSortChange,
  onTokenFilterChange,
  currentSort,
  currentFilter,
}: OrderFiltersProps) {
  return (
    <Card className="border border-border bg-card p-4 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Sort By</label>
          <div className="flex gap-2 flex-wrap">
            {(["newest", "oldest", "most-interested"] as const).map((option) => (
              <Button
                key={option}
                onClick={() => onSortChange(option)}
                variant={currentSort === option ? "default" : "outline"}
                className={
                  currentSort === option
                    ? "bg-primary text-primary-foreground"
                    : "border-border text-foreground hover:bg-secondary"
                }
              >
                {option === "newest" ? "Newest" : option === "oldest" ? "Oldest" : "Most Interested"}
              </Button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Token Pair</label>
          <div className="flex gap-2 flex-wrap">
            {(["all", "zUSDC", "zUSDT"] as const).map((filter) => (
              <Button
                key={filter}
                onClick={() => onTokenFilterChange(filter)}
                variant={currentFilter === filter ? "default" : "outline"}
                className={
                  currentFilter === filter
                    ? "bg-primary text-primary-foreground"
                    : "border-border text-foreground hover:bg-secondary"
                }
              >
                {filter === "all" ? "All Pairs" : filter}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </Card>
  )
}
