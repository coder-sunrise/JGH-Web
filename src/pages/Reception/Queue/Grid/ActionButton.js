import React, { memo, useMemo } from 'react'
// custom components
import { Tooltip, withStyles } from '@material-ui/core'
// medisys component
import { GridContextMenuButton as GridButton } from '@/components/_medisys'
import {
  StatusIndicator,
  AppointmentContextMenu,
  ContextMenuOptions,
  filterMap,
  VISIT_STATUS,
} from '../variables'

const ActionButton = ({ row, onClick }) => {
  const { visitStatus } = row

  if (visitStatus === VISIT_STATUS.UPCOMING_APPT) {
    return (
      <Tooltip title='More Actions'>
        <div>
          <GridButton
            row={row}
            onClick={onClick}
            contextMenuOptions={AppointmentContextMenu.map((opt) => {
              switch (opt.id) {
                case 8: // register visit
                  return {
                    ...opt,
                    disabled: row.patientProfileFk === undefined,
                  }
                case 9: // register patient
                  return {
                    ...opt,
                    disabled: row.patientProfileFk !== undefined,
                  }
                default:
                  return { ...opt }
              }
            })}
          />
        </div>
      </Tooltip>
    )
  }

  const isStatusWaiting = row.visitStatus === VISIT_STATUS.WAITING
  const isStatusInProgress = filterMap[StatusIndicator.IN_PROGRESS].includes(
    row.visitStatus,
  )
  // const isStatusDispense = row.visitStatus === VISIT_STATUS.DISPENSE

  const isStatusCompleted = [
    VISIT_STATUS.COMPLETED,
    VISIT_STATUS.DISPENSE,
    VISIT_STATUS.ORDER_UPDATED,
  ].includes(row.visitStatus)

  const hideResumeButton = ![
    VISIT_STATUS.IN_CONS,
    VISIT_STATUS.PAUSED,
  ].includes(row.visitStatus)

  const enableDispense = [
    VISIT_STATUS.DISPENSE,
    VISIT_STATUS.ORDER_UPDATED,
  ].includes(row.visitStatus)

  const enableBilling = [
    VISIT_STATUS.BILLING,
  ].includes(row.visitStatus)

  const newContextMenuOptions = useMemo(
    () =>
      ContextMenuOptions.map((opt) => {
        switch (opt.id) {
          case 0: // view visit
            return { ...opt, hidden: !isStatusWaiting }
          case 0.1: // edit visit
            return { ...opt, hidden: isStatusWaiting }
          case 1: // dispense
            return {
              ...opt,
              disabled: !enableDispense,
            }
          case 1.1: // billing
            return { ...opt, disabled: !enableBilling }
          case 2: // delete visit
            return { ...opt, disabled: !isStatusWaiting }
          case 5: // start consultation
            return {
              ...opt,
              disabled: isStatusInProgress,
            }
          case 6: // resume consultation
            return {
              ...opt,
              disabled: !isStatusInProgress,
              hidden: hideResumeButton,
            }
          case 7: // edit consultation
            return {
              ...opt,
              disabled: !isStatusCompleted,
              hidden: !isStatusCompleted,
            }
          default:
            return { ...opt }
        }
      }),
    [
      row.rowIndex,
      row.visitStatus,
    ],
  )
  return (
    <Tooltip title='More Actions'>
      <div>
        <GridButton
          row={row}
          onClick={onClick}
          contextMenuOptions={newContextMenuOptions}
        />
      </div>
    </Tooltip>
  )
}

export default ActionButton
