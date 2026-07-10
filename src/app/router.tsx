import { createBrowserRouter, Navigate } from 'react-router-dom'
import { routes } from './routes'
import { FlowMenu } from '@/features/home/FlowMenu'
import { Gallery } from '@/features/ds/Gallery'
import {
  InstallScreen,
  WelcomeScreen,
  MemberCheckScreen,
  LoginScreen,
  PromiseScreen,
  SurveyCommunitiesScreen,
  SurveyPrioritiesScreen,
  PermissionsScreen,
  DoneScreen,
} from '@/features/onboarding/screens'
import { ProductInsightsScreen } from '@/features/productInsights/screens'
import { AnnotationsScreen } from '@/features/annotations/screens'
import { PriorityInferenceScreen } from '@/features/priorityInference/screens'
import { DecisionSupportScreen } from '@/features/decisionSupport/screens'
import { CollaborationScreen } from '@/features/collaboration/screens'
import { PostPurchaseScreen } from '@/features/postPurchase/screens'
import { ChatScreen } from '@/features/chat/screens'
import { TourScreen } from '@/features/tour/screens'

export const router = createBrowserRouter([
  // The default screen starts the real flow (Chrome Web Store install).
  { path: '/', element: <InstallScreen /> },
  // The screen-gallery / clickthrough menu lives on its own sub-page now.
  { path: '/navigation', element: <FlowMenu /> },

  { path: routes.install, element: <InstallScreen /> },
  { path: routes.welcome, element: <WelcomeScreen /> },
  { path: routes.memberCheck, element: <MemberCheckScreen /> },
  { path: routes.login, element: <LoginScreen /> },
  { path: routes.promise, element: <PromiseScreen /> },
  { path: routes.surveyCommunities, element: <SurveyCommunitiesScreen /> },
  { path: routes.surveyPriorities, element: <SurveyPrioritiesScreen /> },
  { path: routes.permissions, element: <PermissionsScreen /> },
  { path: routes.done, element: <DoneScreen /> },

  { path: '/browse/tour', element: <TourScreen /> },
  { path: routes.insights, element: <ProductInsightsScreen /> },
  { path: routes.annotations, element: <AnnotationsScreen /> },
  { path: routes.priorities, element: <PriorityInferenceScreen /> },
  { path: routes.decision, element: <DecisionSupportScreen /> },
  { path: routes.collaborate, element: <CollaborationScreen /> },
  { path: routes.postPurchase, element: <PostPurchaseScreen /> },
  { path: routes.chat, element: <ChatScreen /> },

  { path: routes.ds, element: <Gallery /> },
  { path: '*', element: <Navigate to="/" replace /> },
])
