import axios from 'axios';
import authHeader from './auth-header';

class AuthService {
  login(user) {
    return axios
      .post('/api/login', {
        username: user.username,
        password: user.password,
      })
      .then(response => {
        if (response.data.token) {
          localStorage.setItem('token', JSON.stringify(response.data.token));
        }

        return response.data;
      });
  }

  logout() {
    localStorage.removeItem('token');
  }

  // USER CRUD
  registerUser(user) {
    return axios.post('/api/register', user, {headers: authHeader()});
  }

  registerGuestUser(user) {
    // eslint-disable-next-line no-param-reassign
    user.username = user.email;
    return axios.post('/api/register_guest', user);
  }

  updateUser(user) {
    return axios.patch(`/api/users/${user.userID}`, user, {
      headers: authHeader(),
    });
  }

  updatePassword(user) {
    return axios.post(
      '/api/updateUserPassword',
      {
        userID: user.userID,
        password: user.password,
      },
      {
        headers: authHeader(),
      }
    );
  }

  getUsers() {
    return axios.get('/api/users', {headers: authHeader()});
  }

  deleteUser(user) {
    return axios.post('/api/delete-user', user, {headers: authHeader()});
  }
}

export default new AuthService();
