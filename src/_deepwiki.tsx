import { useState } from 'react'
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors, useDraggable, useDroppable } from '@dnd-kit/core'
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core'

interface Task {
	_id: string
	title: string
	checked: boolean
	list: string
	position?: { x: number; y: number } // Added for free dragging
}

interface TaskList {
	_id: string
	title: string
	color: string
	position?: { x: number; y: number } // Added for positioning
	size?: { width: number; height: number } // Added for drop zones
}

interface ToDoData {
	lists: Record<string, TaskList>
	tasksByList: Record<string, string[]>
	tasks: Record<string, Task>
}

// Free draggable task component
function DraggableTask({ task }: { task: Task }) {
	const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
		id: task._id,
	})

	const style = {
		position: 'absolute' as const,
		left: (task.position?.x || 0) + (transform?.x || 0),
		top: (task.position?.y || 0) + (transform?.y || 0),
		opacity: isDragging ? 0.5 : 1,
		backgroundColor: 'white',
		padding: '12px',
		borderRadius: '4px',
		border: '1px solid #ddd',
		cursor: 'grab',
		minWidth: '150px',
		textDecoration: task.checked ? 'line-through' : 'none',
	}

	return (
		<div ref={setNodeRef} style={style} {...attributes} {...listeners} className="draggable-task">
			{task.title}
		</div>
	)
}

// Droppable list area
function DroppableList({ list }: { list: TaskList }) {
	const { setNodeRef, isOver } = useDroppable({
		id: list._id,
	})

	const style = {
		position: 'absolute' as const,
		left: list.position?.x || 0,
		top: list.position?.y || 0,
		width: list.size?.width || 250,
		height: list.size?.height || 300,
		backgroundColor: isOver ? '#f0f0f0' : list.color + '20', // Light version of list color
		border: `2px solid ${list.color}`,
		borderRadius: '8px',
		padding: '16px',
	}

	return (
		<div ref={setNodeRef} style={style} className="droppable-list">
			<h3 style={{ color: list.color, margin: '0 0 16px 0' }}>{list.title}</h3>
		</div>
	)
}

export function FreeTaskBoard() {
	const [toDoData, setToDoData] = useState<ToDoData>({
		lists: {
			'list-1': {
				_id: 'list-1',
				title: 'To Do',
				color: '#ff6b6b',
				position: { x: 20, y: 50 },
				size: { width: 250, height: 300 },
			},
			'list-2': {
				_id: 'list-2',
				title: 'In Progress',
				color: '#4ecdc4',
				position: { x: 320, y: 50 },
				size: { width: 250, height: 300 },
			},
			'list-3': {
				_id: 'list-3',
				title: 'Done',
				color: '#45b7d1',
				position: { x: 620, y: 50 },
				size: { width: 250, height: 300 },
			},
		},
		tasksByList: {
			'list-1': ['task-1', 'task-3'],
			'list-2': ['task-2'],
			'list-3': ['task-4', 'task-5'],
		},
		tasks: {
			'task-1': {
				_id: 'task-1',
				title: 'Buy groceries',
				checked: false,
				list: 'list-1',
				position: { x: 50, y: 100 },
			},
			'task-2': {
				_id: 'task-2',
				title: 'Review code',
				checked: false,
				list: 'list-2',
				position: { x: 350, y: 100 },
			},
			'task-3': {
				_id: 'task-3',
				title: 'Call dentist',
				checked: false,
				list: 'list-1',
				position: { x: 50, y: 160 },
			},
			'task-4': {
				_id: 'task-4',
				title: 'Submit report',
				checked: true,
				list: 'list-3',
				position: { x: 650, y: 100 },
			},
			'task-5': {
				_id: 'task-5',
				title: 'Update resume',
				checked: true,
				list: 'list-3',
				position: { x: 650, y: 160 },
			},
		},
	})

	const [activeTask, setActiveTask] = useState<Task | null>(null)

	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: { distance: 8 },
		})
	)

	function handleDragStart(event: DragStartEvent) {
		const task = toDoData.tasks[event.active.id as string]
		setActiveTask(task || null)
	}

	function handleDragEnd(event: DragEndEvent) {
		const { active, over, delta } = event
		setActiveTask(null)

		if (!delta) return

		const taskId = active.id as string
		const currentTask = toDoData.tasks[taskId]

		if (!currentTask) return

		setToDoData((prevData) => {
			const newTasks = { ...prevData.tasks }
			const newTasksByList = { ...prevData.tasksByList }

			// Update task position
			newTasks[taskId] = {
				...currentTask,
				position: {
					x: (currentTask.position?.x || 0) + delta.x,
					y: (currentTask.position?.y || 0) + delta.y,
				},
			}

			// If dropped over a different list, update list assignment
			if (over && over.id !== currentTask.list && prevData.lists[over.id as string]) {
				const oldListId = currentTask.list
				const newListId = over.id as string

				// Remove from old list
				newTasksByList[oldListId] = newTasksByList[oldListId].filter((id) => id !== taskId)

				// Add to new list
				if (!newTasksByList[newListId]) {
					newTasksByList[newListId] = []
				}
				newTasksByList[newListId].push(taskId)

				// Update task's list reference
				newTasks[taskId] = {
					...newTasks[taskId],
					list: newListId,
				}
			}

			return {
				...prevData,
				tasks: newTasks,
				tasksByList: newTasksByList,
			}
		})
	}

	return (
		<DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
			<div
				className="free-task-board"
				style={{
					position: 'relative',
					width: '100vw',
					height: '100vh',
					backgroundColor: '#f8f9fa',
				}}>
				{/* Render droppable list areas */}
				{Object.values(toDoData.lists).map((list) => (
					<DroppableList key={list._id} list={list} />
				))}

				{/* Render all tasks */}
				{Object.values(toDoData.tasks).map((task) => (
					<DraggableTask key={task._id} task={task} />
				))}
			</div>

			<DragOverlay>
				{activeTask ? (
					<div
						className="draggable-task dragging"
						style={{
							backgroundColor: 'white',
							padding: '12px',
							borderRadius: '4px',
							border: '1px solid #ddd',
							opacity: 0.8,
							transform: 'rotate(5deg)',
							textDecoration: activeTask.checked ? 'line-through' : 'none',
						}}>
						{activeTask.title}
					</div>
				) : null}
			</DragOverlay>
		</DndContext>
	)
}
