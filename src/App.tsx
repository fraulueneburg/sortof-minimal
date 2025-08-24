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
		const currListOrder = [...toDoData.tasksByList[currentListId]]

		const overType = over.data.current.type
		const overItem = over.data.current.item
		const targetListId = overType === 'task' ? overItem.list : over.id
		const targetListOrder = [...toDoData.tasksByList[targetListId]]

		let newPosition = { x: 0, y: 0 }

		const isFirstList = targetListId === 'list-1'
		const isDifferentList = currentListId !== targetListId
		const isSameList = currentListId === targetListId

		if (!currentTask || !targetListId) return
		if (overType === 'task' && currentTaskId === over.id && !isFirstList) return

		// update position
		if (isFirstList) {
			const taskMeasurements = draggedItemRef
				? {
						height: draggedItemRef.getBoundingClientRect().height,
						width: draggedItemRef.getBoundingClientRect().width,
						top: draggedItemRef.getBoundingClientRect().top,
						left: draggedItemRef.getBoundingClientRect().left,
				  }
				: null

			const draggedDistance = { x: delta.x, y: delta.y }
			const taskStartPos = { x: taskMeasurements?.left || 0, y: taskMeasurements?.top || 0 }
			const taskEndPos = { x: taskStartPos.x + draggedDistance.x, y: taskStartPos.y + draggedDistance.y }

			const listElem = document.querySelector(`.${targetListId}`) as HTMLElement
			const listRect = listElem.getBoundingClientRect()
			const listWidth = listRect.width
			const listHeight = listRect.height
			const listOffset = { x: listRect.left, y: listRect.top }

			const taskEndPosPercent = {
				x: (taskEndPos.x - listOffset.x) / (listWidth / 100),
				y: (taskEndPos.y - listOffset.y) / (listHeight / 100),
			}

			const taskWidthPercent = (taskMeasurements?.width || 0) / (listWidth / 100)
			const taskHeightPercent = (taskMeasurements?.height || 0) / (listHeight / 100)

			newPosition = {
				x: Math.max(0, Math.min(taskEndPosPercent.x, 100 - taskWidthPercent)),
				y: Math.max(0, Math.min(taskEndPosPercent.y, 100 - taskHeightPercent)),
			}
		}

		const moveTask = (newListOrder: string[]) => {
			const currIndex = currListOrder.indexOf(currentTaskId)
			const newIndex = overType === 'list' || isFirstList ? newListOrder.length : newListOrder.indexOf(over.id as string)

			if (!isFirstList && isSameList && currIndex === newIndex) return

			currListOrder.splice(currIndex, 1)
			newListOrder.splice(newIndex, 0, currentTaskId)
		}

		moveTask(isSameList ? currListOrder : targetListOrder)

		setToDoData((prev) => {
			const { tasks, tasksByList } = prev

			const updatedTask = {
				...tasks[currentTaskId],
				...(isDifferentList ? { list: targetListId } : {}),
				...(isFirstList ? { position: newPosition } : {}),
			}

			return {
				...prev,
				tasks: {
					...tasks,
					[currentTaskId]: updatedTask,
				},
				tasksByList: {
					...tasksByList,
					[currentListId]: [...currListOrder],
					...(isDifferentList && { [targetListId]: [...targetListOrder] }),
				},
			}
		})

		setDraggedItemRef(null)
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
						tasks={toDoData.tasksByList[list._id].map((currentTaskId) => toDoData.tasks[currentTaskId])}
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
