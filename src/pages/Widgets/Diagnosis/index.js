import React, { PureComponent } from 'react'
import moment from 'moment'
import { connect } from 'dva'
import { FieldArray } from 'formik'
import { getUniqueGUID } from 'utils'
import { withStyles } from '@material-ui/core'
import Add from '@material-ui/icons/Add'
import { AuthorizedContext, Button } from '@/components'
import Authorized from '@/utils/Authorized'
import Item from './Item'
import { USER_PREFERENCE_TYPE, SYSTEM_LANGUAGE } from '@/utils/constants'
import codetable from '@/models/codetable'

const styles = theme => ({
  diagnosisRow: {
    marginBottom: theme.spacing(1),
    padding: theme.spacing(0.5),
  },
})
@connect(({ diagnosis, codetable, consultation }) => ({
  diagnosis,
  codetable,
  consultation,
}))
class Diagnosis extends PureComponent {
  constructor(props) {
    super(props)
  }

  fetchCodeTables = async () => {
    await Promise.all([
      dispatch({
        type: 'codetable/fetchCodes',
        payload: {
          code: 'ctComplication',
        },
      }),
      dispatch({
        type: 'codetable/fetchCodes',
        payload: { code: 'userpreference' },
      }),
    ])
  }
  componentDidMount() {
    const { dispatch } = this.props
    this.fetchCodeTables()
    dispatch({
      type: 'diagnosis/getUserPreference',
      payload: {
        type: USER_PREFERENCE_TYPE.FAVOURITEDIAGNOSISSETTING,
      },
    })
    dispatch({
      type: 'diagnosis/getUserPreference',
      payload: {
        type: USER_PREFERENCE_TYPE.FAVOURITEDIAGNOSISLANGUAGESETTING,
      },
    }).then(response => {
      if (response) {
        const { favouriteDiagnosisLanguage: favouriteLanguage } = response
        this.props.dispatch({
          type: 'diagnosis/updateState',
          payload: {
            favouriteDiagnosisLanguage:
              favouriteLanguage || SYSTEM_LANGUAGE.PRIMARYLANGUAGE,
          },
        })
      }
    })
  }

  componentWillReceiveProps(nextProps) {
    if (
      !this.props.diagnosis.shouldAddNew &&
      nextProps.diagnosis.shouldAddNew
    ) {
      let index = 0
      if (this.diagnosises.length === 0) {
        index = 1
      } else {
        index = this.diagnosises[this.diagnosises.length - 1].sequence
      }
      this.addDiagnosis(index + 1)
      this.props.dispatch({
        type: 'diagnosis/updateState',
        payload: {
          shouldAddNew: false,
        },
      })
    }
  }

  addDiagnosis = index => {
    const { diagnosis } = this.props
    let currentSelectCategory = diagnosis.favouriteDiagnosisCategory || []
    if (currentSelectCategory.length === 4) {
      currentSelectCategory = ['all', ...currentSelectCategory]
    }
    this.arrayHelpers.push({
      uid: getUniqueGUID(),
      sequence: index,
      isNew: true,
      currentSelectCategory,
    })
  }

  handleAddDiagnosisClick = () => {
    let index = 0
    if (this.diagnosises.length === 0) {
      index = 1
    } else {
      index = this.diagnosises[this.diagnosises.length - 1].sequence
    }
    this.addDiagnosis(index + 1)
  }

  clearFavouriteDiagnosisMessage = uid => {
    const { form } = this.arrayHelpers
    const { values, setFieldValue } = form
    setFieldValue(
      'corDiagnosis',
      (values.corDiagnosis || []).map(d => {
        if (d.uid === uid) {
          return {
            ...d,
            favouriteDiagnosisMessage: undefined,
          }
        }
        return d
      }),
    )
  }

  clearFavouriteDiagnosisCategoryMessage = uid => {
    const { form } = this.arrayHelpers
    const { values, setFieldValue } = form
    setFieldValue(
      'corDiagnosis',
      (values.corDiagnosis || []).map(d => {
        if (d.uid === uid) {
          return {
            ...d,
            favouriteDiagnosisCategoryMessage: undefined,
          }
        }
        return d
      }),
    )
  }

  saveDiagnosisAsFavourite = (dignosisCode, uid) => {
    const { dispatch, diagnosis } = this.props
    let newFavouriteDiagnosis
    let addNewFavorite
    if ((diagnosis.favouriteDiagnosis || []).find(d => d === dignosisCode)) {
      newFavouriteDiagnosis = (diagnosis.favouriteDiagnosis || []).filter(
        d => d !== dignosisCode,
      )
    } else {
      addNewFavorite = true
      newFavouriteDiagnosis = [
        ...(diagnosis.favouriteDiagnosis || []),
        dignosisCode,
      ]
    }
    dispatch({
      type: 'diagnosis/saveUserPreference',
      payload: {
        userPreferenceDetails: {
          value: newFavouriteDiagnosis,
          Identifier: 'FavouriteDiagnosis',
        },
        itemIdentifier: 'FavouriteDiagnosis',
        type: '6',
      },
    }).then(r => {
      if (r) {
        dispatch({
          type: 'diagnosis/getUserPreference',
          payload: {
            type: '6',
          },
        }).then(response => {
          if (response) {
            const { form } = this.arrayHelpers
            const { values, setFieldValue } = form
            setFieldValue(
              'corDiagnosis',
              (values.corDiagnosis || []).map(d => {
                if (d.uid === uid) {
                  return {
                    ...d,
                    favouriteDiagnosisMessage: addNewFavorite
                      ? 'Add to favourite successfully'
                      : 'Remove favourite successfully',
                  }
                }
                return d
              }),
            )

            setTimeout(() => {
              this.clearFavouriteDiagnosisMessage(uid)
            }, 3000)
          }
        })
      }
    })
  }

  saveCategoryAsFavourite = (favouriteCategory, uid) => {
    const { dispatch } = this.props
    dispatch({
      type: 'diagnosis/saveUserPreference',
      payload: {
        userPreferenceDetails: {
          value: favouriteCategory,
          Identifier: 'FavouriteDiagnosisCategory',
        },
        itemIdentifier: 'FavouriteDiagnosisCategory',
      },
    }).then(r => {
      if (r) {
        dispatch({
          type: 'diagnosis/getUserPreference',
          payload: {
            type: '6',
          },
        }).then(response => {
          if (response) {
            const { form } = this.arrayHelpers
            const { values, setFieldValue } = form
            setFieldValue(
              'corDiagnosis',
              (values.corDiagnosis || []).map(d => {
                if (d.uid === uid) {
                  return {
                    ...d,
                    favouriteDiagnosisCategoryMessage: 'Saved successfully',
                  }
                }
                return d
              }),
            )

            setTimeout(() => {
              this.clearFavouriteDiagnosisCategoryMessage(uid)
            }, 3000)
          }
        })
      }
    })
  }

  getDiagnosisAccessRight = () => {
    const { isEnableEditOrder = true } = this.props
    let right = Authorized.check('queue.consultation.widgets.diagnosis') || {
      rights: 'hidden',
    }
    if (right.rights === 'enable' && !isEnableEditOrder) {
      right = { rights: 'disable' }
    }
    return right
  }
  render() {
    const { rights, diagnosis, user, visitRegistration } = this.props
    console.log(22)
    return (
      <div>
        <FieldArray
          name='corDiagnosis'
          render={arrayHelpers => {
            const { form } = arrayHelpers
            const { values } = form
            this.diagnosises = values.corDiagnosis || []

            this.arrayHelpers = arrayHelpers
            if (this.diagnosises.length === 0) {
              if (rights === 'enable') {
                this.addDiagnosis(1)
                return null
              }
            }

            return this.diagnosises.map((v, i) => {
              if (v.isDeleted === true) return null
              return (
                <AuthorizedContext.Provider
                  value={this.getDiagnosisAccessRight()}
                >
                  <div key={v.uid}>
                    <Item
                      {...this.props}
                      ctCompilation={this.props.codetable}
                      index={i}
                      arrayHelpers={arrayHelpers}
                      diagnosises={this.diagnosises}
                      saveCategoryAsFavourite={this.saveCategoryAsFavourite}
                      saveDiagnosisAsFavourite={this.saveDiagnosisAsFavourite}
                      uid={v.uid}
                      diagnosisCode={v.diagnosisCode}
                      favouriteDiagnosisMessage={v.favouriteDiagnosisMessage}
                      favouriteDiagnosisCategoryMessage={
                        v.favouriteDiagnosisCategoryMessage
                      }
                      favouriteDiagnosis={diagnosis.favouriteDiagnosis || []}
                      favouriteDiagnosisCategory={
                        diagnosis.favouriteDiagnosisCategory || []
                      }
                      currentSelectCategory={v.currentSelectCategory || []}
                    />
                  </div>
                </AuthorizedContext.Provider>
              )
            })
          }}
        />

        <AuthorizedContext.Provider
          value={{
            rights:
              this.getDiagnosisAccessRight()?.rights !== 'enable'
                ? 'hidden'
                : 'enable',
          }}
        >
          <div>
            <Button
              size='sm'
              color='primary'
              onClick={this.handleAddDiagnosisClick}
            >
              <Add />
              Add Diagnosis
            </Button>
          </div>
        </AuthorizedContext.Provider>
      </div>
    )
  }
}

export default withStyles(styles, { withTheme: true })(Diagnosis)
