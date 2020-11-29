import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:persefone/theme/colors/light_colors.dart';
import 'package:persefone/widgets/my_date_field.dart';
import 'package:persefone/widgets/top_container.dart';
import 'package:persefone/widgets/back_button.dart';
import 'package:persefone/widgets/my_text_field.dart';
import 'package:persefone/screens/home_page.dart';

class CreateNewPlantPage extends StatelessWidget {
  GlobalKey<FormState> formKey = GlobalKey<FormState>();
  TextEditingController nome = TextEditingController();
  TextEditingController nomecientifico = TextEditingController();
  TextEditingController data = TextEditingController(text:  DateTime.now().day.toString() + '/' +  DateTime.now().month.toString() + '/'+ DateTime.now().year.toString());
  TextEditingController descricao = TextEditingController();

  @override
  Widget build(BuildContext context) {
    double width = MediaQuery.of(context).size.width;
    var downwardIcon = Icon(
      Icons.keyboard_arrow_down,
      color: Colors.black54,
    );
    return Scaffold(
      backgroundColor: LightColors.kLightYellow,
      body: SafeArea(
        child: Column(
          children: <Widget>[
            TopContainer(
              padding: const EdgeInsets.only(top: 13, left: 15, right: 25),
              width: width,
              height: 60,
              child: Column(
                children: <Widget>[
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: <Widget>[
                      MyBackButton(),
                      Text(
                        'Nova Planta',
                        style: TextStyle(
                            fontSize: 22.0, fontWeight: FontWeight.w700),
                      ),
                      Text(
                        '',
                        style: TextStyle(
                            fontSize: 22.0, fontWeight: FontWeight.w700),
                      )
                    ],
                  ),

                  /*SizedBox(
                    height: 30,
                  ),*/
                  /*Row(
                    mainAxisAlignment: MainAxisAlignment.start,
                    children: <Widget>[
                      ,
                    ],
                  ),*/
                ],
              ),
            ),
            Expanded(
                child: SingleChildScrollView(
              padding: EdgeInsets.symmetric(horizontal: 20),
              child: Form(
                key: formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: <Widget>[
                    Container(
                        child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: <Widget>[
                        MyTextField(
                          label: 'Nome',
                          controller: nome,
                          obrigatorio: true,
                        ),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.start,
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: <Widget>[
                            Expanded(
                              child: MyTextField(
                                label: 'Nome Científico',
                                controller: nomecientifico,
                                /* icon: Icon(
                                Icons.category,
                                color: Colors.black54,
                              ),*/
                              ),
                            ),
                          ],
                        )
                      ],
                    )),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: <Widget>[
                        Expanded(
                            child: MyDateField(
                          label: 'Data',
                          controller: data,
                          // icon: downwardIcon,
                        )),
                        /*SizedBox(width: 40),
                      Expanded(
                        child: MyTextField(
                          label: 'Data de Morte',
                      //    icon: downwardIcon,
                        ),
                      ),*/
                      ],
                    ),
                    SizedBox(height: 20),
                    MyTextField(
                      label: 'Descrição',
                      controller: descricao,
                      minLines: 3,
                      maxLines: 3,
                    ),
                    SizedBox(height: 20),
                  ],
                ),
              ),
            )),
            Container(
              height: 80,
              width: width,
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: <Widget>[
                  GestureDetector(
                    onTap: () {
                      if (formKey.currentState.validate()) {
                        FirebaseFirestore.instance
                            .collection("planta")
                            .doc()
                            .set({
                          "nome": nome.text,
                          "nomecientifico": nomecientifico.text,
                          "descricao": descricao.text,
                          "data": data.text
                        });
                        Navigator.pop(context);
                      }
                    },
                    child: Container(
                      child: Text(
                        'Adicionar',
                        style: TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.w700,
                            fontSize: 18),
                      ),
                      alignment: Alignment.center,
                      margin: EdgeInsets.fromLTRB(20, 10, 20, 20),
                      width: width - 40,
                      decoration: BoxDecoration(
                        color: LightColors.kGreen,
                        borderRadius: BorderRadius.circular(30),
                      ),
                    ),
                  )
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
