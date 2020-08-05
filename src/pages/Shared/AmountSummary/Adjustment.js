import React from 'react'
import Delete from '@material-ui/icons/Delete'
import {
  GridContainer,
  GridItem,
  Button,
  NumberInput,
  Popconfirm,
  Field,
  Tooltip,
} from '@/components'

const Adjustment = ({
  index,
  adjustments,
  dispatch,
  adjAmount,
  adjValue,
  adjRemark,
  onDelete,
  amountProps,
  type,
}) => {
  // console.log('Adjustment', amountProps)
  const isExactAmount = type === 'ExactAmount'
  return (
    <GridContainer>
      <GridItem xs={7}>
        <div
          style={{
            width: '105%',
            overflow: 'hidden',
            display: 'inline-block',
            textOverflow: 'ellipsis',
            wordBreak: 'keep-all',
            whiteSpace: 'nowrap',
            marginLeft: 8,
            textAlign: 'right',
          }}
        >
          <Tooltip title={adjRemark}>
            <span>
              {adjRemark}
              {/* {adjRemark} {!isExactAmount && `(${Math.abs(adjValue)}%)`} */}
            </span>
          </Tooltip>
        </div>
      </GridItem>
      <GridItem xs={1}>
        <Tooltip title='Delete Adjustment'>
          <Button
            color='danger'
            size='sm'
            aria-label='Delete'
            justIcon
            onClick={() => {
              onDelete(index)
            }}
            style={{
              marginLeft: 15,
            }}
          >
            <Delete />
          </Button>
        </Tooltip>
      </GridItem>
      <GridItem xs={4}>
        <NumberInput
          value={adjAmount}
          {...amountProps}
          // currency={isExactAmount}
          // percentage={!isExactAmount}
        />
      </GridItem>
    </GridContainer>
  )
}

export default Adjustment
