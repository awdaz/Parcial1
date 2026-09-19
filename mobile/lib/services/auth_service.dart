import 'package:shared_preferences/shared_preferences.dart';

import '../api/api_client.dart';

class AuthService {
  static Future<void> login(String email, String contrasena) async {
    final data = await ApiClient.post(
      '/auth/login',
      body: {'email': email, 'contrasena': contrasena},
      auth: false,
    );
    final token = data['access_token'] as String;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('fashionstore_token', token);
  }

  static Future<void> logout() async {
    await ApiClient.clearSession();
  }
}