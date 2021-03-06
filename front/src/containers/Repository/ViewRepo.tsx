import * as RepositoriesAPI from '@api/repositories'
import {
  Alert,
  AlertDescription,
  AlertIcon,
  Box,
  Button,
  Code,
  Flex,
  Stack,
  Tab,
  TabList,
  Tag,
  TagLabel,
  Text,
  useClipboard,
  Switch,
  FormLabel,
} from '@chakra-ui/core'
import DependencyTabs from '@components/DependencyTabs'
import { DependenciesProvider } from '@contexts/DependenciesContext'
import { useRepository } from '@contexts/RepositoryContext'
import { getNewScore, sortDependencies } from '@utils/dependencies'
import React, { useState, useMemo } from 'react'
import { DiGitPullRequest } from 'react-icons/di'
import { createUpgradePR } from '../../api/repositories'
import { Row } from '../../components/Flex'

export function SelectAllButton({
  selectAllChecked,
  onSelectAllDependencies,
}: {
  selectAllChecked: boolean
  onSelectAllDependencies: () => void
}) {
  return (
    <Flex justifyContent="flex-end" alignItems="center" flexDirection="row">
      <FormLabel cursor="pointer" htmlFor="select-all">
        Update all dependencies
      </FormLabel>
      <Switch
        color="secondary"
        size="sm"
        id="select-all"
        isChecked={selectAllChecked}
        onChange={onSelectAllDependencies}
      />
    </Flex>
  )
}

const TabListItems = ({
  dependencies,
  devDependencies,
}: {
  dependencies: Dependency[]
  devDependencies: Dependency[]
}) => {
  return (
    <TabList>
      <Tab disabled={dependencies.length === 0}>Dependencies</Tab>
      <Tab disabled={devDependencies.length === 0}>Dev Dependencies </Tab>
    </TabList>
  )
}

export const DependenciesTypeTabs = React.memo(TabListItems)
export const SelectAll = React.memo(SelectAllButton)

function ViewRepo() {
  const {
    repository,
    increasePRCount,
    updateScore,
    outdatedCount,
  } = useRepository()

  const [showSuccess, setShowSuccess] = React.useState(false)
  const [selectAllChecked, setSelectAllChecked] = React.useState(false)
  const [selectedDependencies, setSelectedDependencies] = useState<{
    [key: string]: 'stable' | 'latest'
  }>({})

  const nbSelectedDependencies = Object.keys(selectedDependencies).length

  React.useEffect(() => {
    const newScore = getNewScore(
      nbSelectedDependencies,
      outdatedCount,
      repository?.packageJson,
    )
    updateScore(newScore)
  }, [nbSelectedDependencies, outdatedCount, repository, updateScore])

  const items = Object.keys(selectedDependencies).map(
    (key) =>
      `${key}${
        selectedDependencies[key] === 'latest'
          ? `@${selectedDependencies[key]}`
          : ''
      }`,
  )

  const commandeLine = `yarn upgrade ${items.join(' ')}`
  const { onCopy, hasCopied } = useClipboard(commandeLine)

  const { dependencies, devDependencies } = useMemo(
    () => sortDependencies(repository!),
    [repository],
  )

  const onDependencySelected = React.useCallback(
    (checked: boolean, name: string, type: 'stable' | 'latest') => {
      if (checked) {
        setSelectedDependencies((prevSelectedDependencies) => ({
          ...prevSelectedDependencies,
          [name]: type,
        }))
      } else {
        setSelectedDependencies((prevSelectedDependencies) => {
          const { [name]: omit, ...rest } = prevSelectedDependencies
          return { ...rest }
        })
      }
    },
    [setSelectedDependencies],
  )

  const onSelectAllDependencies = React.useCallback(() => {
    if (selectAllChecked) {
      setSelectedDependencies({})
    } else {
      const deps = dependencies
        .map((dep) => {
          return { [dep.name]: 'latest' }
        })
        .concat(
          devDependencies.map((dep) => {
            return { [dep.name]: 'latest' }
          }),
        )
      let selectedDeps = {}
      for (const dep of deps) {
        selectedDeps = { ...selectedDeps, ...dep }
      }
      setSelectedDependencies(selectedDeps)
    }
    setSelectAllChecked((selectAllChecked) => !selectAllChecked)
  }, [setSelectedDependencies, dependencies, devDependencies, selectAllChecked])

  if (!repository) {
    return null
  }

  const createPR = async () => {
    await createUpgradePR(repository.fullName, {
      updatedDependencies: items,
      repoId: repository.id,
    })

    setShowSuccess(true)
    window.scrollTo(0, 0)
    increasePRCount()
  }

  const recomputeDeps = () => {
    return RepositoriesAPI.recomputeDeps(repository.id)
  }

  const hasSelectedDependencies = Object.keys(selectedDependencies).length > 0

  return (
    <>
      {repository.crawlError && (
        <Row py={1}>
          <Tag variantColor="red" rounded="full" size="sm" mx={1}>
            <TagLabel>Error</TagLabel>
          </Tag>
          <Text color="red.500">{`Something went wrong when fetching dependencies : ${repository.crawlError}`}</Text>
        </Row>
      )}

      <Code
        position="relative"
        width="100%"
        rounded={10}
        whiteSpace="normal"
        my={5}
        p={5}
      >
        {hasSelectedDependencies
          ? commandeLine
          : `yarn upgrade [pick some dependencies]`}

        {hasSelectedDependencies && (
          <Button
            size="xs"
            variantColor="secondary"
            position="absolute"
            right={3}
            top={-6}
            onClick={onCopy}
          >
            {hasCopied ? 'Copied!' : 'Copy'}
          </Button>
        )}
      </Code>

      <SelectAll
        selectAllChecked={selectAllChecked}
        onSelectAllDependencies={onSelectAllDependencies}
      />

      <DependenciesProvider>
        {repository && repository.dependencies && repository.dependencies.deps && (
          <Box w={['100%', 'unset']} minW={['100%']} mt={4}>
            <DependencyTabs
              dependencies={dependencies}
              devDependencies={devDependencies}
              onDependencySelected={onDependencySelected}
              selectedDependencies={selectedDependencies}
            />

            <Flex
              zIndex={10}
              pos={hasSelectedDependencies ? 'sticky' : 'inherit'}
              bottom={0}
              flexDir="row-reverse"
            >
              <Button
                leftIcon={showSuccess ? 'check-circle' : DiGitPullRequest}
                onClick={createPR}
                variantColor="gray"
                isDisabled={showSuccess || !hasSelectedDependencies}
                m={2}
              >
                {showSuccess ? 'Your PR is on its way!' : 'Create Pull Request'}
              </Button>
            </Flex>
          </Box>
        )}

        {repository && !repository.dependencies && (
          <Alert status="info" mt={6}>
            <AlertIcon />
            <Stack align="flex-start">
              <AlertDescription>
                It looks like your dependencies were not computed. This might be
                due to an unexpected server error.
              </AlertDescription>
              <Button onClick={recomputeDeps}>Retry</Button>
            </Stack>
          </Alert>
        )}
      </DependenciesProvider>
    </>
  )
}

export default ViewRepo
