import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { loginApi, getUserInfo as getUserInfoApi } from '../api/api';

// 定义用户状态接口
interface UserState {
  userInfo: any;          // 用户详细信息对象
  userAvatarUrl: string;  // 用户头像 URL
  code: string | number;  // 接口返回的状态码
  username: string;       // 用户名
  loading: boolean;       // 是否正在加载中（用于显示 Loading 状态）
  error: string | null;   // 错误信息
}

// 初始状态
const initialState: UserState = {
  userInfo: {},
  userAvatarUrl: '',
  code: '',
  username: '',
  loading: false,
  error: null,
};

/**
 * 异步 Thunk：用户登录
 * createAsyncThunk 会自动生成 pending, fulfilled, rejected 三种 action
 * 第一个参数是 action type 的前缀
 * 第二个参数是异步执行函数
 */
export const loginUser = createAsyncThunk(
  'user/login',
  async (loginParams: any, { rejectWithValue }) => {
    try {
      const res = await loginApi(loginParams);
      return res; // 返回的结果会作为 fulfilled action 的 payload
    } catch (err: any) {
      // 如果发生错误，使用 rejectWithValue 返回自定义错误信息
      return rejectWithValue(err.message || '登录失败');
    }
  }
);

/**
 * 异步 Thunk：获取用户信息
 * 用于在登录后或页面刷新时获取最新的用户数据
 */
export const fetchUserInfo = createAsyncThunk(
  'user/fetchUserInfo',
  async (_, { rejectWithValue }) => {
    try {
      const res = await getUserInfoApi();
      return res;
    } catch (err: any) {
      return rejectWithValue(err.message || '获取用户信息失败');
    }
  }
);

// 创建 Slice（切片），包含 reducer 和 action
const userSlice = createSlice({
  name: 'user', // Slice 的名称，用于生成 action type
  initialState,
  // reducers：定义同步的 action 处理逻辑
  reducers: {
    // 清除用户信息（用于退出登录）
    clearUserInfo: (state) => {
      state.userInfo = {};
      state.code = '';
      state.userAvatarUrl = '';
      state.username = '';
    },
    // 单独设置用户头像
    setUserAvatar: (state, action: PayloadAction<string>) => {
      state.userAvatarUrl = action.payload;
    },
  },
  // extraReducers：处理由 createAsyncThunk 生成的异步 action
  extraReducers: (builder) => {
    builder
      // --- 处理登录逻辑 ---
      .addCase(loginUser.pending, (state) => {
        state.loading = true; // 开始请求，设置 loading 为 true
        state.error = null;   // 清空之前的错误
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false; // 请求成功，关闭 loading
        const res = action.payload;
        if (res) {
            state.userInfo = res.data || {};
            state.code = res.code;
            // 如果登录接口直接返回了头像，则更新头像状态
            if (res.data?.headImage) {
                state.userAvatarUrl = res.data.headImage;
            }
        }
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false; // 请求失败，关闭 loading
        state.error = action.payload as string; // 记录错误信息
      })
      // --- 处理获取用户信息逻辑 ---
      .addCase(fetchUserInfo.fulfilled, (state, action) => {
        const res = action.payload;
        if (res && res.code === 0) {
            // 合并用户信息
            state.userInfo = { ...state.userInfo, ...res.data };
            // 更新头像
            if (res.data?.headImage) {
                state.userAvatarUrl = res.data.headImage;
            }
        }
      });
  },
});

// 导出同步 action，供组件中使用 dispatch 调用
export const { clearUserInfo, setUserAvatar } = userSlice.actions;

// 导出 reducer，供 store 配置使用
export default userSlice.reducer;

