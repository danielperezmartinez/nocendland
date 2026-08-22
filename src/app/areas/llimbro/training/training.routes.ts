import {Routes} from '@angular/router';
import {ExerciseRepository} from './data-access/exercise.repository'
import {ScheduleRepository} from './data-access/schedule.repository'
import {TrackingRepository} from './data-access/tracking.repository'
import {ShareRepository} from './data-access/share.repository'
import {TrainingLayoutComponent} from './layout/training-layout.component'
import {TrainingStore} from './state/training.store'
import {confirmPendingTrainingChanges} from './pending-changes.guard'

export const TRAINING_ROUTES: Routes = [
  {
    path: '',
    component: TrainingLayoutComponent,
    providers: [TrainingStore, ExerciseRepository, ScheduleRepository, TrackingRepository, ShareRepository],
    children: [
      {path: '', redirectTo: 'exercises', pathMatch: 'full'},
      {
        path: 'exercises',
        data: {featureTab: 'exercises'},
        loadComponent: () => import('./pages/exercises/exercises.component').then(({ExercisesComponent}) => ExercisesComponent),
      },
      {
        path: 'schedule',
        data: {featureTab: 'schedule'},
        loadComponent: () => import('./pages/schedule/schedule.component').then(({ScheduleComponent}) => ScheduleComponent),
      },
      {
        path: 'tracking',
        data: {featureTab: 'tracking'},
        canDeactivate: [confirmPendingTrainingChanges],
        loadComponent: () => import('./pages/tracking/tracking.component').then(({TrackingComponent}) => TrackingComponent),
      },
      {
        path: 'measurements',
        data: {featureTab: 'measurements'},
        loadComponent: () => import('./pages/measurements/measurements.component').then(({MeasurementsComponent}) => MeasurementsComponent),
      },
      {
        path: 'exercise-form/:id',
        data: {featureTab: 'exercises', featureSwipe: false},
        canDeactivate: [confirmPendingTrainingChanges],
        loadComponent: () => import('./pages/exercise-form/exercise-form.component').then(({ExerciseFormComponent}) => ExerciseFormComponent),
      },
      {
        path: 'exercises/:id',
        data: {featureTab: 'exercises', featureSwipe: false},
        loadComponent: () => import('./pages/exercise-detail/exercise-detail.component').then(({ExerciseDetailComponent}) => ExerciseDetailComponent),
      },
    ],
  },
];
