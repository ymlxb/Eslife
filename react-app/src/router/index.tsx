import { lazy, Suspense, ReactNode } from 'react';
import { createHashRouter, Navigate } from 'react-router-dom';
import { Spin } from 'antd';

// 懒加载包装器
const lazyLoad = (children: ReactNode) => {
  return (
    <Suspense 
      fallback={
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <Spin size="large" />
        </div>
      }
    >
      {children}
    </Suspense>
  );
};

// 路由组件懒加载
const Main = lazy(() => import('../views/Main'));
const Person = lazy(() => import('../views/Person'));
const Home = lazy(() => import('../views/Home'));
const Login = lazy(() => import('../views/Login'));
const Brand = lazy(() => import('../views/Brand'));
const Community = lazy(() => import('../views/Community'));
const Trade = lazy(() => import('../views/Trade'));
const Detail = lazy(() => import('../views/Detail'));
const Search = lazy(() => import('../views/Search'));
const UserInfo = lazy(() => import('../views/Person/UserInfo'));
const EditUserInfo = lazy(() => import('../views/Person/EditUserInfo'));
const GoodsPublish = lazy(() => import('../views/Person/GoodsPublish'));
const PostPublish = lazy(() => import('../views/Person/PostPublish'));
const UpAvatar = lazy(() => import('../views/Person/UpAvatar'));
const UpPassWord = lazy(() => import('../views/Person/UpPassWord'));

const Im = lazy(() => import('../views/Im'));
const AI = lazy(() => import('../views/AI'));
const CarbonFootprint = lazy(() => import('../views/CarbonFootprint'));
const MallInfo = lazy(() => import('../views/MallInfo'));
const EditMallInfo = lazy(() => import('../views/EditMallInfo'));
const About = lazy(() => import('../views/About'));
const Guide = lazy(() => import('../views/Guide'));
const UpAddress = lazy(() => import('../views/Person/UpAddress'));

// 占位符组件不需要懒加载，或者也可以懒加载
import {
  UserOrder
} from '../views/placeholders';

const router = createHashRouter([
  {
    path: '/',
    element: <Navigate to="/login" replace />,
  },
  {
    path: '/login',
    element: lazyLoad(<Login />),
  },
  {
    path: '/',
    element: lazyLoad(<Main />),
    children: [
      {
        path: 'home',
        element: lazyLoad(<Home />),
      },
      {
        path: 'brand',
        element: lazyLoad(<Brand />),
      },
      {
        path: 'community',
        element: lazyLoad(<Community />),
      },
      {
        path: 'about',
        element: lazyLoad(<About />),
      },
      {
        path: 'trade',
        element: lazyLoad(<Trade />),
      },
      {
        path: 'guide',
        element: lazyLoad(<Guide />),
      },
      {
        path: 'editMall',
        element: lazyLoad(<EditMallInfo />),
      },
      {
        path: 'mall',
        element: lazyLoad(<MallInfo />),
      },
      {
        path: 'detail/:id',
        element: lazyLoad(<Detail />),
      },
      {
        path: 'search',
        element: lazyLoad(<Search />),
      },
      {
        path: 'im',
        element: lazyLoad(<Im />),
      },
      {
        path: 'ai',
        element: lazyLoad(<AI />),
      },
      {
        path: 'carbon',
        element: lazyLoad(<CarbonFootprint />),
      },
      {
        path: 'person',
        element: lazyLoad(<Person />),
        children: [
          {
            path: 'userInfo',
            element: lazyLoad(<UserInfo />),
          },
          {
            path: 'editUserInfo',
            element: lazyLoad(<EditUserInfo />),
          },
          {
            path: 'userOrder',
            element: <UserOrder />,
          },
          {
            path: 'upAddress',
            element: lazyLoad(<UpAddress />),
          },
          {
            path: 'upAvatar',
            element: lazyLoad(<UpAvatar />),
          },
          {
            path: 'upPassWord',
            element: lazyLoad(<UpPassWord />),
          },
          {
            path: 'goodsPublish',
            element: lazyLoad(<GoodsPublish />),
          },
          {
            path: 'postPublish',
            element: lazyLoad(<PostPublish />),
          },
        ],
      },
    ],
  },
]);

export default router;
