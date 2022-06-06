import React from 'react'
import { GridItem } from '@/components'

export const TextGridItem = ({ children, md = 6, ...restProps }) => {
  return (
    <GridItem md={md} {...restProps}>
      <span className='baseOnCustomStyle'>
        {typeof children === 'string' && children.trim() !== ''
          ? children
          : '-'}
      </span>
    </GridItem>
  )
}
