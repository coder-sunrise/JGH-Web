import React, { useEffect, useState, useContext } from 'react'
import { useDispatch } from 'dva'
import { CommonModal } from '@/components'
import WorklistContext from '@/pages/Radiology/Worklist/WorklistContext'
import Details from './Details'

const PharmacyDetails = ({
  refreshClick,
  fromModule = 'Main',
  startRefreshTimer,
  stopRefreshTimer,
}) => {
  const dispatch = useDispatch()
  const { detailsId, setDetailsId } = useContext(WorklistContext)
  const [showModal, setShowModal] = useState(false)
  const getCodeTables = () => {
    dispatch({
      type: 'codetable/fetchCodes',
      payload: {
        code: 'inventorymedication',
        force: true,
      },
    })

    dispatch({
      type: 'codetable/fetchCodes',
      payload: {
        code: 'inventoryvaccination',
        force: true,
      },
    })

    dispatch({
      type: 'codetable/fetchCodes',
      payload: {
        code: 'inventoryconsumable',
        force: true,
      },
    })

    dispatch({
      type: 'codetable/fetchCodes',
      payload: {
        code: 'ctservice',
        force: true,
      },
    })
  }
  useEffect(() => {
    if (detailsId) {
      getCodeTables()
      dispatch({
        type: 'pharmacyDetails/updateState',
        payload: { fromModule },
      })
      dispatch({
        type: 'pharmacyDetails/query',
        payload: { id: detailsId },
      }).then(r => {
        if (r) {
          if (stopRefreshTimer) {
            stopRefreshTimer()
          }
          setShowModal(true)
        } else {
          setDetailsId(undefined)
          dispatch({
            type: 'global/updateAppState',
            payload: {
              openConfirm: true,
              isInformType: true,
              openConfirmText: 'OK',
              openConfirmContent: `Pharmacy workitem has been remove by others, click Ok to refresh worklist.`,
              onConfirmClose: () => {
                refreshClick()
              },
            },
          })
        }
      })
    }
  }, [detailsId])

  const closeForm = () => {
    setDetailsId(null)
    setShowModal(false)
    dispatch({
      type: 'pharmacyDetails/updateState',
      payload: { entity: undefined, fromModule: undefined },
    })
    refreshClick()
    if (startRefreshTimer) {
      startRefreshTimer()
    }
  }

  return (
    <CommonModal
      open={showModal}
      title='Dispensary Details'
      onClose={() => {
        closeForm()
      }}
      fullScreen
      overrideLoading
      observe='PharmarcyWorklistDetail'
      showFooter={false}
      onConfirm={() => {
        closeForm()
      }}
    >
      <Details refreshClick={refreshClick} />
    </CommonModal>
  )
}

export default PharmacyDetails
