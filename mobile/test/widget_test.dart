import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app/main.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  testWidgets('La app arranca en la pantalla de inicio de sesión', (tester) async {
    SharedPreferences.setMockInitialValues({});
    await tester.pumpWidget(const FashionStoreApp());

    expect(find.text('FashionStore'), findsOneWidget);
    expect(find.text('Ingresar'), findsOneWidget);
    expect(find.byType(TextField).evaluate().length, greaterThanOrEqualTo(2));
  });
}