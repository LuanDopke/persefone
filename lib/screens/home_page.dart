import 'package:flutter/material.dart';
import 'package:persefone/screens/mnt_plant_page.dart';
import 'package:persefone/screens/plant_info.dart';
//import 'package:persefone/screens/calendar_page.dart';
import 'package:persefone/theme/colors/light_colors.dart';
//import 'package:percent_indicator/percent_indicator.dart';
import 'package:persefone/widgets/task_column.dart';
import 'package:persefone/widgets/active_project_card.dart';
import 'package:persefone/widgets/top_container.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_core/firebase_core.dart';

class HomePage extends StatefulWidget {
  @override
  _HomePageState createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  String queryString = "";

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

  void updateSearchQuery(String newQuery) {
    setState(() {
      queryString = newQuery;
    });
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
                    /*Container(
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
                    ),*/
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
                                      builder: (context) => CreateNewPlantPage(null),
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
                        ),
                    ),
                Container(
                  margin: EdgeInsets.only(left:25,top:5,right:25,bottom:10.0),
                  child: TextFormField(
                          style: TextStyle(color: Colors.black87),
                          onChanged: (value) {
                            updateSearchQuery(value);
                          },
                          autofocus: false,
                          decoration: InputDecoration(
                          labelText: "Pesquisar",
                          labelStyle: TextStyle(color: Colors.black45),
                          focusedBorder:
                          UnderlineInputBorder(borderSide: BorderSide(color: Colors.black)),
                          border:
                          UnderlineInputBorder(borderSide: BorderSide(color: Colors.grey))),
                      ),
                    ),
                    Container(
                      color: Colors.transparent,
                      padding: EdgeInsets.symmetric(
                          horizontal: 10.0, vertical: 10.0),
                      child: StreamBuilder(
                          stream: queryString != "" ? FirebaseFirestore.instance
                              .collection("planta")
                              .where("nome", isEqualTo: queryString)
                              //.orderBy("nome", descending: false)
                              .snapshots() :
                          FirebaseFirestore.instance
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
                                if (!snapshot.hasData || snapshot.data.documents.length == 0) {
                                  //
                                  return Center(
                                    child: Text(
                                      "Não encontrado, tente pesquisar pelo nome completo diferenciando maiúsculas de minusculas",
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
                                        funcao: () => {
                                          Navigator.push(
                                              (context),
                                              MaterialPageRoute(builder: (context) => PlantInfo(snapshot.data.documents[index])))
                                        },
                                        planta: snapshot.data.documents[index],
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
