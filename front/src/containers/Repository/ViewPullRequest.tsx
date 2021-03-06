import { Box, Flex, Text } from '@chakra-ui/core'
import React from 'react'
import { useRouteMatch } from 'react-router-dom'
import PullRequestItem from '../../components/PullRequest/PullRequestItem'
import { useAxiosRequest } from '../../hooks/useRequest'
import { getPullRequests } from '../../api/repositories'
import { PullRequest } from '@typings/entities'
import { useRepository } from '../../contexts/RepositoryContext'

const ViewPullRequest = () => {
  const {
    params: { id },
  } = useRouteMatch<{ id: string }>()
  const { data } = useAxiosRequest<PullRequest[]>(
    `repositories/${id}/pull-requests`,
    {
      fetcher: () => getPullRequests(id),
      refreshInterval: 3000,
    },
  )

  const { repository, updateScore } = useRepository()

  React.useEffect(() => {
    updateScore(repository?.score || 0)
  }, [repository, updateScore])

  return (
    <>
      <Box
        bg="yellow.100"
        padding={3}
        rounded={10}
        fontSize="sm"
        color="yellow.800"
      >
        <span role="img" aria-label="WIP">
          🚧
        </span>{' '}
        PR creation is experimental. It only supports Yarn packager (yarn.lock
        file will be created even if there is a package-lock.json).
      </Box>
      {data && data.length > 0 ? (
        <>
          <Box w="100%" py={4}>
            {data.map((pullRequest) => (
              <PullRequestItem pullRequest={pullRequest} key={pullRequest.id} />
            ))}
          </Box>
        </>
      ) : (
        <Flex
          alignItems="center"
          flexDirection="column"
          justify="space-around"
          height="10rem"
        >
          <Text color="secondary.50" fontSize="xl">
            No pull requests
          </Text>
        </Flex>
      )}
    </>
  )
}

export default ViewPullRequest
