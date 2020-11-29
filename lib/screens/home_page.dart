import 'package:flutter/material.dart';
import 'package:persefone/screens/mnt_plant_page.dart';
//import 'package:persefone/screens/calendar_page.dart';
import 'package:persefone/theme/colors/light_colors.dart';
//import 'package:percent_indicator/percent_indicator.dart';
import 'package:persefone/widgets/task_column.dart';
import 'package:persefone/widgets/active_project_card.dart';
import 'package:persefone/widgets/top_container.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_core/firebase_core.dart';

class HomePage extends StatelessWidget {
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
                        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                        children: <Widget>[
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.center,
                            children: <Widget>[
                              Container(
                                child: Text(
                                  'Perséfone',
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
                                  'Cuidados com plantas',
                                  textAlign: TextAlign.start,
                                  style: TextStyle(
                                    fontSize: 16.0,
                                    color: Colors.black45,
                                    fontWeight: FontWeight.w400,
                                  ),
                                ),
                              ),
                            ],
                          )
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
                              subheading('Informações'),
                              /*GestureDetector(
                                onTap: () {
                                  /*Navigator.push(
                                    context,
                                    MaterialPageRoute(
                                        builder: (context) => CalendarPage()),
                                  );*/
                                },
                                child: calendarIcon(),
                              ),*/
                            ],
                          ),
                          SizedBox(height: 15.0),
                          TaskColumn(
                            icon: Icons.alarm,
                            iconBackgroundColor: LightColors.kRed,
                            title: 'Regar',
                            subtitle: 'lorem ipsum',
                          ),
                          SizedBox(
                            height: 15.0,
                          ),
                          TaskColumn(
                            icon: Icons.blur_circular,
                            iconBackgroundColor: LightColors.kDarkYellow,
                            title: 'Adubar',
                            subtitle: 'lorem ipsum',
                          ),
                          SizedBox(height: 15.0),
                          TaskColumn(
                            icon: Icons.check_circle_outline,
                            iconBackgroundColor: LightColors.kBlue,
                            title: 'Trocar Vaso',
                            subtitle: 'lorem ipsum',
                          ),
                        ],
                      ),
                    ),
                    Container(
                        color: Colors.transparent,
                        padding: EdgeInsets.only(
                            left: 20.0, right: 20, bottom: 0, top: 20),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.center,
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: <Widget>[
                            subheading('Plantas'),
                            Container(
                              height: 40.0,
                              width: 120,
                              decoration: BoxDecoration(
                                color: LightColors.kGreen,
                                borderRadius: BorderRadius.circular(30),
                              ),
                              child: FlatButton(
                                onPressed: () {
                                  Navigator.push(
                                    context,
                                    MaterialPageRoute(
                                      builder: (context) => CreateNewPlantPage(),
                                    ),
                                  );
                                },
                                child: Center(
                                  child: Text(
                                    'Adicionar',
                                    style: TextStyle(
                                        color: Colors.white,
                                        fontWeight: FontWeight.w700,
                                        fontSize: 16),
                                  ),
                                ),
                              ),
                            ),
                          ],
                        )),
                    Container(
                      color: Colors.transparent,
                      padding: EdgeInsets.symmetric(
                          horizontal: 10.0, vertical: 10.0),
                      child: StreamBuilder(
                          stream: FirebaseFirestore.instance
                              .collection("planta")
                              .orderBy("nome", descending: false)
                              .snapshots(),
                          builder: (context, snapshot) {
                            switch (snapshot.connectionState) {
                              case ConnectionState.none:
                              case ConnectionState.done:
                              case ConnectionState.waiting:
                                return Center(
                                  child: CircularProgressIndicator(),
                                );
                              default:
                                if (snapshot.data.documents.length == 0) {
                                  //
                                  return Center(
                                    child: Text(
                                      "Cadastre Plantas!",
                                      style: TextStyle(
                                          color: Colors.redAccent,
                                          fontSize: 20),
                                    ),
                                  );
                                }
                                return GridView.builder(
                                    gridDelegate:
                                        SliverGridDelegateWithFixedCrossAxisCount(
                                            crossAxisCount: 2),
                                    itemCount: snapshot.data.documents.length,
                                    //scrollDirection: Axis.vertical,
                                    physics: NeverScrollableScrollPhysics(),
                                    shrinkWrap: true,
                                    itemBuilder: (context, index) {
                                      return ActiveProjectsCard(
                                        cardColor: LightColors.kDarkYellow,
                                        loadingPercent: 0.45,
                                        title: snapshot.data.documents[index]
                                            .data()["nome"]
                                            .toString(),
                                        subtitle: snapshot.data.documents[index]
                                            .data()["nomecientifico"]
                                            .toString(),
                                      );
                                    });
                            }
                          }),
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
