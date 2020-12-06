import 'package:flutter/material.dart';
import 'package:persefone/screens/mnt_plant_page.dart';
import 'package:persefone/screens/plant_info.dart';
//import 'package:persefone/screens/calendar_page.dart';
import 'package:persefone/theme/colors/light_colors.dart';
import 'package:persefone/widgets/back_button.dart';
//import 'package:percent_indicator/percent_indicator.dart';
import 'package:persefone/widgets/task_column.dart';
import 'package:persefone/widgets/active_project_card.dart';
import 'package:persefone/widgets/top_container.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_core/firebase_core.dart';
class PlantOption extends StatefulWidget {

  final DocumentSnapshot dadosPlanta;
  PlantOption(this.dadosPlanta);

  @override
  _PlantOptionState createState() => _PlantOptionState();
}


class _PlantOptionState extends State<PlantOption>  {

  Text subheading(String title) {
    return Text(
      title,
      style: TextStyle(
          color: LightColors.kDarkBlue,
          fontSize: 30.0,
          fontWeight: FontWeight.w700,
          letterSpacing: 1.2),
    );
  }

  static CircleAvatar addPlantIcon() {
    return CircleAvatar(
      radius: 25.0,
      backgroundColor: LightColors.kGreen,
      child: Icon(
        Icons.add,
        size: 20.0,
        color: Colors.white,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    double width = MediaQuery.of(context).size.width;
    return Scaffold(
      backgroundColor: LightColors.kLightYellow,
      body: SafeArea(
        child: Column(
          children: <Widget>[
            TopContainer(
              height: 60,
              width: width,
              child: Column(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: <Widget>[
                    Padding(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 0, vertical: 0.0),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.center,
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: <Widget>[
                          MyBackButton(),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.center,
                            children: <Widget>[
                              Container(
                                child: Text(
                                  widget.dadosPlanta.data()["nome"],
                                  textAlign: TextAlign.start,
                                  style: TextStyle(
                                    fontSize: 22.0,
                                    color: LightColors.kDarkBlue,
                                    fontWeight: FontWeight.w800,
                                  ),
                                ),
                              ),
                              Container(
                                child: Text(
                                  widget.dadosPlanta.data()["nomecientifico"] == "" ? "Perséfone" :widget.dadosPlanta.data()["nomecientifico"],
                                  textAlign: TextAlign.start,
                                  style: TextStyle(
                                    fontSize: 16.0,
                                    color: Colors.black45,
                                    fontWeight: FontWeight.w400,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          Text('')
                        ],
                      ),
                    )
                  ]),
            ),
            Expanded(
              child: SingleChildScrollView(
                child: Column(
                  children: <Widget>[
                    Container(
                      color: Colors.transparent,
                      padding: EdgeInsets.symmetric(
                          horizontal: 20.0, vertical: 10.0),
                      child: Column(
                        children: <Widget>[
                          Row(
                            crossAxisAlignment: CrossAxisAlignment.center,
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: <Widget>[
                              subheading('Ações'),
                            ],
                          ),
                          SizedBox(height: 15.0),

                          TaskColumn(
                            icon: Icons.edit,
                            iconBackgroundColor: LightColors.kGreen,
                            title: 'Alterar',
                            subtitle: 'Alterar Informações',
                            funcao: () => {
                              Navigator.pop(context),
                              Navigator.pushReplacement(context, MaterialPageRoute(builder: (context) => CreateNewPlantPage(widget.dadosPlanta)))
                             /* Navigator.replace(context,  MaterialPageRoute(builder: (context) => CreateNewPlantPage(widget.dadosPlanta))),
                              Navigator.push(
                                  (context),
                                  MaterialPageRoute(builder: (context) => CreateNewPlantPage(widget.dadosPlanta)))*/
                            },
                          ),
                          SizedBox(height: 15.0),
                          TaskColumn(
                            icon: Icons.cancel,
                            iconBackgroundColor: LightColors.kDarkBlue,
                            title: 'Morreu',
                            subtitle: "A planta falaceu?  :'(",
                          ),
                          SizedBox(height: 15.0),
                          TaskColumn(
                            icon: Icons.healing,
                            iconBackgroundColor: LightColors.kDarkYellow,
                            title: 'Ressuscitar',
                              subtitle: 'A planta voltou a vida  :)',
                          ),
                          SizedBox(height: 15.0),
                          TaskColumn(
                            icon: Icons.people,
                            iconBackgroundColor: LightColors.kBlue,
                            title: 'Doar',
                            subtitle: 'Adicionar como doado.',
                          ),
                          SizedBox(height: 15.0),
                          TaskColumn(
                            icon: Icons.delete_forever,
                            iconBackgroundColor: LightColors.kRed,
                            title: 'Deletar',
                            subtitle: 'Remover permanentemente a planta.',
                            funcao: () => {
                            setState((){
                              FirebaseFirestore.instance.collection('planta')
                                  .doc(widget.dadosPlanta.id)
                                  .delete().then((value) => {
                                    Navigator.pop(context),
                                    Navigator.pop(context)
                              });
                            })
                            },
                          ),
                        ] ,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
