'use client'

import { useState } from 'react'
import { useCartStore } from '@/store/cart-store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from '@/components/ui/sheet'
import { ShoppingCart, Plus, Minus, Trash2, MessageCircle } from 'lucide-react'
import Image from 'next/image'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'

export function CartDrawer() {
  const [open, setOpen] = useState(false)
  const { items, dealershipInfo, removeItem, updateQuantity, clearCart, getTotalItems, getTotalPrice } = useCartStore()

  const totalItems = getTotalItems()
  const totalPrice = getTotalPrice()

  const sendWhatsAppInquiry = () => {
    if (items.length === 0) return

    const dealershipName = dealershipInfo?.name || 'el concesionario'
    const whatsappNumber = dealershipInfo?.main_whatsapp || dealershipInfo?.phone || ''

    const message = `Hola! Estoy interesado en estos productos de ${dealershipName}:\n\n${items
      .map((item) => {
        const price = item.price ? ` - $${(item.price * item.quantity).toLocaleString()}` : ''
        return `• ${item.name} (${item.quantity}x)${price}`
      })
      .join('\n')}\n\n${totalPrice > 0 ? `Total: $${totalPrice.toLocaleString()}\n\n` : ''}¿Están disponibles?`

    const whatsappUrl = `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, '_blank')
    setOpen(false)
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant=\"outline\" className=\"relative\">
          <ShoppingCart className=\"w-5 h-5\" />
          {totalItems > 0 && (
            <Badge 
              variant=\"destructive\" 
              className=\"absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs\"
            >
              {totalItems}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className=\"w-full sm:max-w-lg\">
        <SheetHeader>
          <SheetTitle>Carrito de Consulta</SheetTitle>
          <SheetDescription>
            Selecciona los productos que te interesan
          </SheetDescription>
        </SheetHeader>

        {items.length === 0 ? (
          <div className=\"flex flex-col items-center justify-center h-[60vh] text-center\">
            <ShoppingCart className=\"w-16 h-16 text-muted-foreground mb-4\" />
            <p className=\"text-muted-foreground\">Tu carrito está vacío</p>
            <p className=\"text-sm text-muted-foreground mt-2\">
              Agrega productos para consultar
            </p>
          </div>
        ) : (
          <>
            <ScrollArea className=\"h-[calc(100vh-250px)] pr-4 mt-6\">
              <div className=\"space-y-4\">
                {items.map((item) => {
                  const primaryImage = item.product_images?.find((img) => img.is_primary) || item.product_images?.[0]
                  
                  return (
                    <div key={item.id} className=\"flex gap-4 pb-4 border-b\">
                      <div className=\"relative h-20 w-20 rounded-md overflow-hidden bg-slate-100 dark:bg-slate-800 flex-shrink-0\">
                        {primaryImage ? (
                          <Image
                            src={primaryImage.image_url}
                            alt={item.name}
                            fill
                            className=\"object-cover\"
                          />
                        ) : (
                          <div className=\"flex items-center justify-center h-full text-muted-foreground\">
                            <ShoppingCart className=\"w-8 h-8\" />
                          </div>
                        )}
                      </div>
                      
                      <div className=\"flex-1 space-y-2\">
                        <div>
                          <h4 className=\"font-semibold text-sm line-clamp-1\">{item.name}</h4>
                          {item.brand && (
                            <p className=\"text-xs text-muted-foreground\">
                              {item.brand} {item.model} {item.year}
                            </p>
                          )}
                          {item.price && (
                            <p className=\"text-sm font-bold text-primary\">
                              ${item.price.toLocaleString()}
                            </p>
                          )}
                        </div>
                        
                        <div className=\"flex items-center gap-2\">
                          <Button
                            size=\"icon\"
                            variant=\"outline\"
                            className=\"h-7 w-7\"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          >
                            <Minus className=\"h-3 w-3\" />
                          </Button>
                          <span className=\"text-sm font-medium w-8 text-center\">
                            {item.quantity}
                          </span>
                          <Button
                            size=\"icon\"
                            variant=\"outline\"
                            className=\"h-7 w-7\"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          >
                            <Plus className=\"h-3 w-3\" />
                          </Button>
                          <Button
                            size=\"icon\"
                            variant=\"ghost\"
                            className=\"h-7 w-7 ml-auto text-destructive\"
                            onClick={() => removeItem(item.id)}
                          >
                            <Trash2 className=\"h-4 w-4\" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>

            <div className=\"absolute bottom-0 left-0 right-0 p-6 border-t bg-background\">
              {totalPrice > 0 && (
                <div className=\"flex justify-between items-center mb-4\">
                  <span className=\"text-lg font-semibold\">Total:</span>
                  <span className=\"text-2xl font-bold text-primary\">
                    ${totalPrice.toLocaleString()}
                  </span>
                </div>
              )}
              
              <div className=\"flex gap-2\">
                <Button
                  variant=\"outline\"
                  onClick={clearCart}
                  className=\"flex-1\"
                >
                  Limpiar
                </Button>
                <Button
                  onClick={sendWhatsAppInquiry}
                  className=\"flex-1 bg-[#25D366] hover:bg-[#20BA5A] text-white\"
                >
                  <MessageCircle className=\"w-4 h-4 mr-2\" />
                  Consultar
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
