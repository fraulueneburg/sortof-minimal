import './assets/css/App.css'
import { useState } from 'react'
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors, rectIntersection } from '@dnd-kit/core'

import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core'
import type { TaskData, ToDoData } from './types'
import { dummyData } from './data/dummydata.ts'

import List from './components/List'

export default function App() {
	const [toDoData, setToDoData] = useState<ToDoData>(dummyData)

	const [activeTask, setActiveTask] = useState<TaskData | null>(null)
	const [draggedItemRef, setDraggedItemRef] = useState<HTMLElement | null>(null)

	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: { distance: 8 },
		})
	)

	function handleDragStart(event: DragStartEvent) {
		const task = toDoData.tasks[event.active.id as string]
		const taskElement = document.querySelector(`[data-task-id="${event.active.id}"]`) as HTMLElement

		setActiveTask(task || null)
		setDraggedItemRef(taskElement)
	}

	function handleDragEnd(event: DragEndEvent) {
		const { active, over, delta } = event
		setActiveTask(null)

		if (!over?.data.current) return
		if (!delta || (delta.x === 0 && delta.y === 0)) return

		const currentTaskId = active.id as string
		const currentTask = toDoData.tasks[currentTaskId]
		const currentListId = currentTask.list

		const overType = over.data.current.type
		const overItem = over.data.current.item
		const targetListId = overType === 'task' ? overItem.list : over.id

		const isDifferentList = currentListId !== targetListId
		const isSameList = currentListId === targetListId

		if (!currentTask || !targetListId) return
		if (overType === 'task' && currentTaskId === over.id) return

		const taskMeasurements = draggedItemRef
			? {
					height: draggedItemRef.getBoundingClientRect().height,
					width: draggedItemRef.getBoundingClientRect().width,
					top: draggedItemRef.getBoundingClientRect().top,
					left: draggedItemRef.getBoundingClientRect().left,
			  }
			: null
		setDraggedItemRef(null)

		console.log('-------------------')

		// CASE 01: LIST-1
		// a) moved within
		// - update x/y pos
		// b) moved from another list
		// - remove from old list, add to new
		// - update x/y pos

		// CASE 02: ANY OTHER LIST
		// a) moved within
		// - update order
		// b) moved from another list
		// - remove from old list, add to new
		// - update order

		if (targetListId === 'list-1') {
			// CASE 01: MOVED TO OR WITHIN LIST-1
			// -> adjust position (problem: get measurements of list when overType is task)
			// + new list? -> change list
		} else {
			// CASE 02: MOVED TO OR WITHIN ANY OTHER LIST
			const currListOrder = [...toDoData.tasksByList[currentListId]]
			const targetListOrder = [...toDoData.tasksByList[targetListId]]
			const currIndex = currListOrder.indexOf(currentTaskId)

			const moveTask = (newListOrder: string[]) => {
				const newIndex = overType === 'task' ? newListOrder.indexOf(over.id as string) : newListOrder.length

				if (isSameList && currIndex === newIndex) return

				currListOrder.splice(currIndex, 1)
				newListOrder.splice(newIndex, 0, currentTaskId)
			}

			moveTask(isSameList ? currListOrder : targetListOrder)

			setToDoData((prev) => {
				const { tasks, tasksByList } = prev

				return {
					...prev,
					...(isDifferentList && {
						tasks: {
							...tasks,
							[currentTaskId]: { ...tasks[currentTaskId], list: targetListId },
						},
					}),
					tasksByList: {
						...tasksByList,
						[currentListId]: [...currListOrder],
						...(isDifferentList && { [targetListId]: [...targetListOrder] }),
					},
				}
			})
		}

		// setToDoData((prevData) => {
		// 	const newTasks = { ...prevData.tasks }
		// 	const newTasksByList = { ...prevData.tasksByList }

		// 	let newPosition = {
		// 		x: 0,
		// 		y: 0,
		// 	}

		// 	// const targetIsDifferentList = over.id !== currentTask.list && prevData.lists[over.id as string]
		// 	const targetIsDifferentList = currentListId !== targetListId

		// 	// CASE 01: Task moved to different list
		// 	if (targetIsDifferentList) {
		// 		console.log('CASE 01: Task moved to different list')

		// 		if (targetListId === 'list-1') {
		// 			console.log('-> LIST IS LIST-1')
		// 			const draggedDistance = { x: delta.x, y: delta.y }
		// 			console.log('draggedDistance', draggedDistance)
		// 			const taskStartPos = { x: taskMeasurements?.left || 0, y: taskMeasurements?.top || 0 }
		// 			const taskEndPos = { x: taskStartPos.x + draggedDistance.x, y: taskStartPos.y + draggedDistance.y }

		// 			// 👉👉👉 das hier geht nur mit listen, nicht mit tasks 👉 ÄNDERN!
		// 			// 👉👉👉 wenn (list-1) dann (mit list-maßen arbeiten)
		// 			const listWidth = over.rect.width
		// 			const listHeight = over.rect.height
		// 			const listOffset = { x: over.rect.left, y: over.rect.top }

		// 			const taskEndPosPercent = {
		// 				x: (taskEndPos.x - listOffset.x) / (listWidth / 100),
		// 				y: (taskEndPos.y - listOffset.y) / (listHeight / 100),
		// 			}

		// 			const taskWidthPercent = (taskMeasurements?.width || 0) / (listWidth / 100)
		// 			const taskHeightPercent = (taskMeasurements?.height || 0) / (listHeight / 100)

		// 			newPosition = {
		// 				x: Math.max(0, Math.min(taskEndPosPercent.x, 100 - taskWidthPercent)),
		// 				y: Math.max(0, Math.min(taskEndPosPercent.y, 100 - taskHeightPercent)),
		// 			}
		// 		}

		// 		newTasksByList[currentTask.list] = newTasksByList[currentTask.list].filter((id) => id !== currentTaskId)

		// 		if (!newTasksByList[targetListId]) {
		// 			newTasksByList[targetListId] = []
		// 		}
		// 		if (!newTasksByList[targetListId].includes(currentTaskId)) {
		// 			newTasksByList[targetListId].push(currentTaskId)
		// 		}
		// 	} else {
		// 		// CASE 02: Task moved WITHIN same list
		// 		if (currentTask.list === 'list-1') {
		// 			// within first list = free dragging
		// 			console.log('CASE 02: Task moved WITHIN first list')
		// 			const listWidth = over?.rect.width || 0
		// 			const listHeight = over?.rect.height || 0
		// 			const distancePercent = { x: (delta.x / listWidth) * 100, y: (delta.y / listHeight) * 100 }

		// 			const taskWidthPercent = (taskMeasurements?.width || 0) / (listWidth / 100)
		// 			const taskHeightPercent = (taskMeasurements?.height || 0) / (listHeight / 100)

		// 			newPosition = {
		// 				x: Math.max(0, Math.min(currentTask.position.x + distancePercent.x, 100 - taskWidthPercent)),
		// 				y: Math.max(0, Math.min(currentTask.position.y + distancePercent.y, 100 - taskHeightPercent)),
		// 			}
		// 		} else {
		// 			// within any other list
		// 			console.log('---')
		// 			console.log('CASE 03: Task moved WITHIN any other list than list-1')

		// 			if (overType === 'task') {
		// 				console.log('IS OVER TASK')
		// 				const taskIds = newTasksByList[targetListId]
		// 				const currentIndex = taskIds.indexOf(currentTaskId)
		// 				const targetIndex = taskIds.indexOf(over.id as string)
		// 				console.log('taskIds', taskIds)

		// 				taskIds.splice(currentIndex, 1, over.id as string)
		// 				taskIds.splice(targetIndex, 1, currentTaskId)

		// 				// console.log('currentIndex', currentIndex)
		// 				// console.log('targetIndex', targetIndex)
		// 				console.log('newTasksByList[targetListId]', newTasksByList[targetListId])
		// 			} else {
		// 				console.log('IS OVER LIST')
		// 			}

		// 			// console.log('active', active)
		// 			// console.log('over', over)
		// 		}
		// 	}

		// 	newTasks[currentTaskId] = {
		// 		...currentTask,
		// 		position: newPosition,
		// 		list: targetListId,
		// 	}

		// 	return {
		// 		...prevData,
		// 		tasks: newTasks,
		// 		tasksByList: newTasksByList,
		// 	}
		// })
	}

	return (
		<DndContext
			sensors={sensors}
			collisionDetection={rectIntersection}
			onDragStart={handleDragStart}
			onDragEnd={handleDragEnd}>
			<div className="task-board">
				{Object.values(toDoData.lists).map((list) => (
					<List
						key={list._id}
						list={list}
						tasks={toDoData.tasksByList[list._id].map((taskId) => toDoData.tasks[taskId])}
						taskIds={toDoData.tasksByList[list._id]}
					/>
				))}
			</div>

			<DragOverlay>
				{activeTask ? (
					<section className="task dragging">
						<span>{activeTask.title}</span>
					</section>
				) : null}
			</DragOverlay>
		</DndContext>
	)
}
