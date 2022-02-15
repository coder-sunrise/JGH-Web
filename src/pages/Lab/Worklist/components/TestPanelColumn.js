import React, { useContext, useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { PRIORITY_VALUES } from '@/utils/constants'

export const TestPanelColumn = ({ testPanels, columnWidth = 350 }) => {
  const testPanelHtml = [...testPanels]
    //Sort by Priority then by the alphabetical order
    .sort((a, b) =>
      a.priority === b.priority
        ? a.testPanelName < b.testPanelName
          ? -1
          : 1
        : a.priority === PRIORITY_VALUES.URGENT
        ? -1
        : 1,
    )
    .map(item =>
      item.priority === PRIORITY_VALUES.URGENT
        ? `<span style="color:red;"> ${item.testPanelName}</span>`
        : `${item.testPanelName}`,
    )
    .join(', ')

  return (
    <p
      style={{
        width: columnWidth - 16, //Column width - 16 (left and righ 8 px padding)
        display: '-webkit-box',
        WebkitBoxOrient: 'vertical',
        WebkitLineClamp: 2,
        overflow: 'hidden',
      }}
      dangerouslySetInnerHTML={{
        __html: testPanelHtml,
      }}
    ></p>
  )
}

TestPanelColumn.propTypes = {
  testPanels: PropTypes.arrayOf(
    PropTypes.shape({
      priority: PropTypes.string.isRequired,
      testPanelName: PropTypes.string.isRequired,
    }).isRequired,
  ).isRequired,
}
