// import { CommonTableGrid } from '@/components'

// export default ({ classes, current }) => (
//   <div>
//     <div
//
//       dangerouslySetInnerHTML={{ __html: current.chiefComplaints }}
//     />
//   </div>
// )

import { CommonTableGrid } from '@/components'

export default ({ classes, current }) => {
  let e = document.createElement('div')
  e.innerHTML = current.chiefComplaints
  let htmlData = e.childNodes.length === 0 ? '' : e.childNodes[0].nodeValue

  return (
    <div>
      {current.chiefComplaints !== undefined ? (
        <div
          className={classes.paragraph}
          dangerouslySetInnerHTML={{ __html: htmlData }}
        />
      ) : (
        ''
      )}
    </div>
  )
}
