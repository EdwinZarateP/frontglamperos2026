'use client'

import { useRef } from 'react'
import { Upload, X, GripVertical } from 'lucide-react'
import {
  DndContext,
  closestCenter,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  rectSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

export type ImagenItem = File | string

interface Props {
  imagenes: ImagenItem[]
  onChange: (imagenes: ImagenItem[]) => void
}

function getPreviewSrc(item: ImagenItem): string {
  return typeof item === 'string' ? item : URL.createObjectURL(item)
}

function FotoItem({ item, id, index, onRemove }: { item: ImagenItem; id: string; index: number; onRemove: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative aspect-square rounded-xl overflow-hidden bg-stone-100 group border-2 border-transparent hover:border-emerald-400 transition-colors"
    >
      <img
        src={getPreviewSrc(item)}
        alt=""
        className="w-full h-full object-cover"
        draggable={false}
      />
      {/* Drag handle — siempre visible en mobile, hover en desktop */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-1 left-1 p-1.5 rounded-lg bg-black/50 text-white cursor-grab active:cursor-grabbing opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity touch-none"
      >
        <GripVertical size={14} />
      </div>
      {/* Remove */}
      <button
        type="button"
        onClick={onRemove}
        className="absolute top-1 right-1 p-1.5 rounded-lg bg-black/50 text-white hover:bg-red-500/80 transition-colors"
      >
        <X size={13} />
      </button>
      {/* Badge primera foto */}
      {index === 0 && (
        <div className="absolute bottom-1 left-1 right-1 text-center">
          <span className="text-[10px] bg-brand text-white px-1.5 py-0.5 rounded-md">
            Portada
          </span>
        </div>
      )}
      {/* Badge guardada */}
      {typeof item === 'string' && index > 0 && (
        <div className="absolute bottom-1 right-1">
          <span className="text-[10px] bg-stone-600/70 text-white px-1.5 py-0.5 rounded-md">
            ✓
          </span>
        </div>
      )}
    </div>
  )
}

export function FotosUpload({ imagenes, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = imagenes.findIndex((_, i) => `file-${i}` === active.id)
    const newIndex = imagenes.findIndex((_, i) => `file-${i}` === over.id)
    onChange(arrayMove(imagenes, oldIndex, newIndex))
  }

  const handleAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    onChange([...imagenes, ...files].slice(0, 30))
    if (inputRef.current) inputRef.current.value = ''
  }

  const ids = imagenes.map((_, i) => `file-${i}`)

  const pendientes = imagenes.filter((i) => i instanceof File).length
  const faltan = Math.max(0, 5 - imagenes.length)

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <label className="flex flex-col items-center justify-center border-2 border-dashed border-stone-300 rounded-xl p-6 sm:p-8 cursor-pointer hover:border-emerald-400 transition-colors">
        <Upload size={28} className="text-stone-400 mb-2" />
        <span className="text-sm font-medium text-stone-600">Sube hasta 30 fotos</span>
        <span className="text-xs text-stone-400 mt-1">Mínimo 5 · JPG, PNG, WebP</span>
        <input ref={inputRef} type="file" accept="image/*" multiple className="sr-only" onChange={handleAdd} />
      </label>

      {imagenes.length > 0 && (
        <>
          <p className="text-xs text-stone-400">
            <span className="hidden sm:inline">Arrastra</span>
            <span className="sm:hidden">Mantén presionado y arrastra</span>
            {' '}las fotos para cambiar el orden — la primera será la portada
            {faltan > 0 && <span className="ml-2 text-red-400">· faltan {faltan} foto{faltan > 1 ? 's' : ''}</span>}
            {faltan === 0 && pendientes > 0 && <span className="ml-2 text-amber-500">· {pendientes} pendiente{pendientes > 1 ? 's' : ''} de guardar</span>}
          </p>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={ids} strategy={rectSortingStrategy}>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                {imagenes.map((item, i) => (
                  <FotoItem
                    key={ids[i]}
                    id={ids[i]}
                    index={i}
                    item={item}
                    onRemove={() => onChange(imagenes.filter((_, idx) => idx !== i))}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </>
      )}
    </div>
  )
}
