import React, { PureComponent } from 'react'
import { FormattedMessage } from 'umi'
import Search from '@material-ui/icons/Search'
import Add from '@material-ui/icons/Add'
import { status } from '@/utils/codes'
import {
  withFormikExtend,
  FastField,
  GridContainer,
  GridItem,
  Button,
  TextField,
  ProgressButton,
  Select,
} from '@/components'
import { SYSTEM_LANGUAGE } from '@/utils/constants'

@withFormikExtend({
  mapPropsToValues: ({ settingMedicineTrivia }) =>
    settingMedicineTrivia.filter || {},
  handleSubmit: () => {},
  displayName: 'MedicineTriviaFilter',
})
class Filter extends PureComponent {
  render() {
    const { classes } = this.props
    return (
      <div className={classes.filterBar}>
        <GridContainer>
          <GridItem xs={6} md={3}>
            <FastField
              name='codeDisplayValue'
              render={args => {
                return <TextField label='Code / Display Value' {...args} />
              }}
            />
          </GridItem>
          <GridItem>
            <div className={classes.filterBtn}>
              <ProgressButton
                color='primary'
                icon={<Search />}
                onClick={() => {
                  const { codeDisplayValue } = this.props.values
                  const { clinicSettings } = this.props
                  const {
                    primaryPrintoutLanguage = SYSTEM_LANGUAGE.PRIMARYLANGUAGE,
                    secondaryPrintoutLanguage = '',
                  } = clinicSettings
                  this.props.dispatch({
                    type: 'settingMedicineTrivia/query',
                    payload: {
                      apiCriteria: {
                        Language:
                          primaryPrintoutLanguage ===
                            SYSTEM_LANGUAGE.SECONDLANGUAGE ||
                          secondaryPrintoutLanguage ===
                            SYSTEM_LANGUAGE.SECONDLANGUAGE
                            ? SYSTEM_LANGUAGE.SECONDLANGUAGE
                            : '',
                        Key: 'displayValue',
                        SearchValue: codeDisplayValue,
                      },
                      sorting: [
                        { columnName: 'isDefault', direction: 'desc' },
                        { columnName: 'updateDate', direction: 'desc' },
                      ],
                    },
                  })
                }}
              >
                <FormattedMessage id='form.search' />
              </ProgressButton>

              <Button
                color='primary'
                onClick={() => {
                  this.props.dispatch({
                    type: 'settingMedicineTrivia/updateState',
                    payload: {
                      entity: undefined,
                    },
                  })
                  this.props.toggleModal()
                }}
              >
                <Add />
                Add New
              </Button>
            </div>
          </GridItem>
        </GridContainer>
      </div>
    )
  }
}

export default Filter
