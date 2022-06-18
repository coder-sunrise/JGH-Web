import React from 'react'
// formik
import { FastField, Field } from 'formik'
// custom component
import {
  GridContainer,
  GridItem,
  DatePicker,
  TextField,
  CodeSelect,
  Tooltip,
} from '@/components'
import { APPOINTMENT_STATUSOPTIONS } from '@/utils/constants'
import _ from 'lodash'

const AppointmentDate = ({
  values,
  patientProfile,
  disabled,
  onVisitPurposeSelected,
  visitOrderTemplateOptions,
}) => {
  const status = APPOINTMENT_STATUSOPTIONS.find(
    x => x.id === values.appointmentStatusFk,
  )
  var patientCopayers = patientProfile?.patientScheme
    ?.filter(x => !x.isExpired && x.isSchemeActive && x.isCopayerActive)
    ?.map(x => x.copayerFK)
  let availableVisitOrderTemplate = []
  if (patientProfile) {
    visitOrderTemplateOptions.forEach(template => {
      if ((template.visitOrderTemplate_Copayers || []).length === 0) {
        availableVisitOrderTemplate.push({ ...template, type: 'general' })
      } else {
        if (
          _.intersection(
            template.visitOrderTemplate_Copayers.map(x => x.copayerFK),
            patientCopayers,
          ).length > 0
        ) {
          availableVisitOrderTemplate.push({ ...template, type: 'copayer' })
        }
      }
    })
    availableVisitOrderTemplate = _.orderBy(
      availableVisitOrderTemplate,
      [
        data => data?.type?.toLowerCase(),
        data => data?.displayValue?.toLowerCase(),
      ],
      ['asc', 'asc'],
    )
  } else {
    visitOrderTemplateOptions.forEach(template => {
      // if haven't select patient profile, then only show general package
      if ((template.visitOrderTemplate_Copayers || []).length === 0) {
        availableVisitOrderTemplate.push({ ...template })
      }
    })
    availableVisitOrderTemplate = _.orderBy(
      availableVisitOrderTemplate,
      [data => data?.displayValue?.toLowerCase()],
      ['asc'],
    )
  }

  const handleVisitOrderTemplateChange = opts => {
    onVisitPurposeSelected(opts)
  }

  return (
    <React.Fragment>
      <GridItem xs md={2}>
        <Field
          name='currentAppointment.appointmentDate'
          // validate={this.startDateValidation}
          render={args => (
            <DatePicker
              {...args}
              disabled={disabled}
              allowClear={false}
              label='Appointment Date'
            />
          )}
        />
      </GridItem>

      <GridItem xs md={2}>
        <TextField
          label='Appointment Status'
          value={status?.name || ''}
          disabled
        />
      </GridItem>

      <GridItem xs md={2}>
        <FastField
          name='bookedByUser'
          render={args => <TextField label='Booked By' disabled {...args} />}
        />
      </GridItem>

      <GridItem xs md={6}>
        <Field
          name='currentAppointment.visitOrderTemplateFK'
          render={args => (
            <CodeSelect
              {...args}
              label='Visit Purpose'
              options={availableVisitOrderTemplate}
              disabled={disabled}
              dropdownStyle={{ width: 500 }}
              dropdownMatchSelectWidth={false}
              renderDropdown={option => {
                const copayers = _.orderBy(
                  option.visitOrderTemplate_Copayers,
                  [data => data?.copayerName?.toLowerCase()],
                  ['asc'],
                )
                  .map(x => x.copayerName)
                  .join(', ')
                const tooltip = (
                  <div>
                    <div>{option.name}</div>
                    {(option.visitOrderTemplate_Copayers || []).length > 0 && (
                      <div>Co-Payer(s): {copayers}</div>
                    )}
                    {(option.visitOrderTemplate_Copayers || []).length ===
                      0 && (
                      <div>
                        <i>General</i>
                      </div>
                    )}
                  </div>
                )
                return (
                  <Tooltip placement='right' title={tooltip}>
                    <div>
                      <div
                        style={{
                          fontWeight: '550',
                          width: '100%',
                          textOverflow: 'ellipsis',
                          overflow: 'hidden',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {option.name}
                      </div>
                      {(option.visitOrderTemplate_Copayers || []).length >
                        0 && (
                        <div
                          style={{
                            width: '100%',
                            textOverflow: 'ellipsis',
                            overflow: 'hidden',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          <span>Co-Payer(s): </span>
                          <span style={{ color: '#4255bd' }}>{copayers}</span>
                        </div>
                      )}
                      {(option.visitOrderTemplate_Copayers || []).length ===
                        0 && (
                        <div
                          style={{
                            width: '100%',
                            textOverflow: 'ellipsis',
                            overflow: 'hidden',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          <span style={{ color: 'green' }}>
                            <i>General</i>
                          </span>
                        </div>
                      )}
                    </div>
                  </Tooltip>
                )
              }}
              onChange={(e, opts) => handleVisitOrderTemplateChange(opts)}
            />
          )}
        />
      </GridItem>
    </React.Fragment>
  )
}

export default AppointmentDate
