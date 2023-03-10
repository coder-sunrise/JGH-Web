import React, { useState } from 'react'
// material ui
import { withStyles } from '@material-ui/core'
import Warning from '@material-ui/icons/Warning'
// common components
import { GridContainer, GridItem, RadioGroup } from '@/components'

const styles = (theme) => ({
  title: {
    display: 'flex',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  spacing: {
    marginBottom: theme.spacing(2),
  },
  warningIcon: {
    margin: theme.spacing.unit * 2,
  },
})

const SeriesConfirmation = ({ classes, footer, onConfirmClick, eventType }) => {
  const [
    editEntire,
    setEditEntire,
  ] = useState('1')

  const onInputChange = (event) => {
    const { target } = event
    setEditEntire(target.value)
  }

  const handleConfirm = () => {
    const editSingle = editEntire === '1'
    onConfirmClick(editSingle)
  }

  return (
    <React.Fragment>
      <GridContainer justify='center'>
        <GridItem md={12}>
          <div className={classes.title}>
            <Warning fontSize='large' className={classes.warningIcon} />
            <h4 style={{ textAlign: 'left' }}>
              {`This is ${eventType === 'Appointment'
                ? 'an appointment'
                : 'a Doctor Block'} in a series. What do you want to open?`}
            </h4>
          </div>
        </GridItem>
        <GridItem>
          <RadioGroup
            label=''
            simple
            vertical
            value={editEntire}
            onChange={onInputChange}
            options={[
              {
                value: '1',
                label: 'Just this one',
              },
              {
                value: '2',
                label: 'The entire series',
              },
            ]}
          />
        </GridItem>
      </GridContainer>
      {footer &&
        footer({
          onConfirm: handleConfirm,
          confirmText: 'Confirm',
        })}
    </React.Fragment>
  )
}

export default withStyles(styles, { name: 'SeriesConfirmation' })(
  SeriesConfirmation,
)
