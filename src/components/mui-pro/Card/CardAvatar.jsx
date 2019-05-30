import React from 'react'
// nodejs library that concatenates classes
import classNames from 'classnames'
// nodejs library to set properties for components
import PropTypes from 'prop-types'
// @material-ui/core components
import withStyles from '@material-ui/core/styles/withStyles'
// @material-ui/icons
// core components

import cardAvatarStyle from 'mui-pro-jss/material-dashboard-pro-react/components/cardAvatarStyle.jsx'

function CardAvatar ({ ...props }) {
  const {
    classes,
    children,
    className,
    plain,
    profile,
    testimonial,
    testimonialFooter,
    square,
    ...rest
  } = props
  const cardAvatarClasses = classNames({
    [classes.cardAvatar]: true,
    [classes.cardAvatarProfile]: profile,
    [classes.cardAvatarPlain]: plain,
    [classes.cardAvatarTestimonial]: testimonial,
    [classes.cardAvatarTestimonialFooter]: testimonialFooter,
    [classes.cardAvatarSquare]: square,
    [className]: className !== undefined,
  })
  return (
    <div className={cardAvatarClasses} {...rest}>
      {children}
    </div>
  )
}

CardAvatar.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  profile: PropTypes.bool,
  plain: PropTypes.bool,
  testimonial: PropTypes.bool,
  testimonialFooter: PropTypes.bool,
}

export default withStyles(cardAvatarStyle)(CardAvatar)
