import React from 'react'
import { Box, BoxProps } from '@chakra-ui/core'

const Container = React.forwardRef<HTMLDivElement, BoxProps>(
  ({ children, ...rest }, ref) => (
    <Box
      ref={ref}
      pos="relative"
      bg="white"
      mb={6}
      rounded={10}
      shadow="md"
      p={5}
      children={children}
      {...rest}
    />
  ),
)

export default Container
