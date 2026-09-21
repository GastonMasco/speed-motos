import { memo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '../ui/Button'

export const Pagination = memo(({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
}) => {
  if (totalPages <= 1) return null

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-gray-800 text-xs text-gray-400">
      <div>
        {totalItems !== undefined ? (
          <span>Mostrando página <strong className="text-gray-200">{currentPage}</strong> de <strong className="text-gray-200">{totalPages}</strong> ({totalItems} registros)</span>
        ) : (
          <span>Página <strong className="text-gray-200">{currentPage}</strong> de <strong className="text-gray-200">{totalPages}</strong></span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          <ChevronLeft size={16} className="mr-1" />
          Anterior
        </Button>

        <span className="px-3 py-1 rounded bg-gray-800 text-gray-200 font-medium">
          {currentPage} / {totalPages}
        </span>

        <Button
          variant="secondary"
          size="sm"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        >
          Siguiente
          <ChevronRight size={16} className="ml-1" />
        </Button>
      </div>
    </div>
  )
})

Pagination.displayName = 'Pagination'
