import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import storage from 'redux-persist/lib/storage'; // 默认使用 localStorage 作为存储引擎
import userReducer from './userSlice';

// 合并所有 reducer
// 目前只有一个 user 模块，后续如果有其他模块（如 cart, product）可以在这里添加
const rootReducer = combineReducers({
  user: userReducer,
});

// 持久化配置
const persistConfig = {
  key: 'root', // 存储在 localStorage 中的 key 前缀
  storage,     // 使用 localStorage
  whitelist: ['user'], // 白名单：只有 user 模块的状态会被持久化，其他模块刷新后会重置
};

// 创建持久化的 reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// 配置 Store
export const store = configureStore({
  reducer: persistedReducer,
  // 配置中间件
  // redux-persist 的 action 包含非序列化数据（如函数），需要忽略序列化检查，否则控制台会报错
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

// 创建持久化存储器，用于在入口文件中包裹应用
export const persistor = persistStore(store);

// 导出 RootState 类型，用于 useSelector 获取状态时的类型提示
export type RootState = ReturnType<typeof store.getState>;
// 导出 AppDispatch 类型，用于 useDispatch 派发 action 时的类型提示
export type AppDispatch = typeof store.dispatch;
