import 'package:flutter/material.dart';
import 'package:persefone/screens/home_page.dart';
import 'package:persefone/screens/plant_info.dart';
import 'package:persefone/theme/colors/light_colors.dart';
import 'package:flutter/services.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:intl/intl.dart';
import 'package:datetime_picker_formfield/datetime_picker_formfield.dart';
void main() async {
  SystemChrome.setSystemUIOverlayStyle(SystemUiOverlayStyle(
    systemNavigationBarColor: LightColors.kLightYellow, // navigation bar color
    statusBarColor:Colors.lightGreen, // status bar color
  ));
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();
 // FirebaseFirestore.instance.collection("clientes").doc().set({"nomeCliente":"Funcionou hoje","emailCliente":"teste@funcionou.com.br"});
  SystemChrome.setSystemUIOverlayStyle(SystemUiOverlayStyle(
      systemNavigationBarColor: Colors.white,
      systemNavigationBarIconBrightness: Brightness.dark,
      systemNavigationBarDividerColor: Colors.red
  ));


  runApp(MyApp());
}

class MyApp extends StatefulWidget {
  @override
  _MyAppState createState() => _MyAppState();
}

class _MyAppState extends  State<MyApp> {
  // This widget is the root of your application.
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Perséfone',
      theme: ThemeData(
        primarySwatch: Colors.blue,
        textTheme: Theme.of(context).textTheme.apply(
            bodyColor: LightColors.kDarkBlue,
            displayColor: LightColors.kDarkBlue,
            fontFamily: 'Poppins'
        ),
      ),
      home: HomePage(),
      debugShowCheckedModeBanner: false,
    );
  }
}
