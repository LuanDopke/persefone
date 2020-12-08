import 'dart:io';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:octo_image/octo_image.dart';
import 'package:persefone/screens/mnt_plant_page.dart';
import 'package:persefone/screens/mnt_timeline.dart';
import 'package:persefone/screens/plant_option.dart';
//import 'package:persefone/screens/calendar_page.dart';
import 'package:persefone/theme/colors/light_colors.dart';
import 'package:persefone/widgets/back_button.dart';
//import 'package:percent_indicator/percent_indicator.dart';
import 'package:persefone/widgets/task_column.dart';
import 'package:persefone/widgets/active_project_card.dart';
import 'package:persefone/widgets/task_container.dart';
import 'package:persefone/widgets/top_container.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_core/firebase_core.dart';

class PlantInfo extends StatefulWidget {
  final DocumentSnapshot dadosPlanta;
  PlantInfo(this.dadosPlanta);

  @override
  _PlantInfoState createState() => _PlantInfoState();
}

class _PlantInfoState extends  State<PlantInfo>  {
  File _imageFile;

  final picker = ImagePicker();
  Future<String> ReturnImage(String filename) async {
    final ref = FirebaseStorage.instance.ref().child(filename);
    String url = await ref.getDownloadURL();
    return url;
  }
  Future pickImage() async {
    final pickedFile = await picker.getImage(source:  ImageSource.gallery);

    setState(() {
      _imageFile = File(pickedFile.path);
    });
  }


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
                          Hero(
                            tag: 'optionbutton',
                            child: GestureDetector(
                              onTap: (){
                               // Navigator.pushReplacement((context), MaterialPageRoute(builder: (context) => PlantOption(widget.dadosPlanta)));
                                Navigator.push(
                                    (context),
                                    MaterialPageRoute(builder: (context) => PlantOption(widget.dadosPlanta)));
                              },
                              child: Align(
                                alignment: Alignment.centerLeft,
                                child: Icon(
                                  Icons.edit,
                                  size: 25,
                                  color: LightColors.kDarkBlue,
                                ),
                              ),
                            ),
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
                          Container(
                            height: 250,
                            margin: const EdgeInsets.only(
                                left: 0, right: 0, top: 10.0, bottom: 10),
                            child: ClipRRect(
                              borderRadius: BorderRadius.circular(30.0),
                              child: FutureBuilder(
                                future: ReturnImage('planta/' + (widget.dadosPlanta != null ?widget.dadosPlanta.data()["imagem"] : '')), //image_picker1298838979554052164
                                builder: (context, AsyncSnapshot<String> snapshot) {
                                    return Container(
                                        //padding: EdgeInsets.all(10),
                                        alignment: Alignment.center,
                                        height: 282,
                                        decoration: BoxDecoration(
                                          color: LightColors.kCInza,
                                          borderRadius: BorderRadius.circular(30.0),
                                          image: snapshot.hasData? DecorationImage(
                                            image: CachedNetworkImageProvider(snapshot.data),
                                            fit: BoxFit.cover,
                                          ) : null,
                                        ),
                                      child: snapshot.hasData ? null : Text("Adicione uma imagem"),
                                    );
                                },
                              ),
                            ),
                          ),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: <Widget>[
                              Container(
                                margin: const EdgeInsets.only(
                                    left: 0, right: 0, top: 0, bottom: 10),
                                child: Text(
                                  widget.dadosPlanta.data()["descricao"],
                                  style: TextStyle(
                                      fontSize: 14.0,
                                      fontWeight: FontWeight.w500,
                                      color: Colors.black45),
                                    ),
                              )
                            ],
                          ),
                        //  TaskContainer(boxColor: LightColors.kCInza, title: "Descrição", subtitle:widget.dadosPlanta.data()["descricao"] ,),
                          Row(
                            crossAxisAlignment: CrossAxisAlignment.center,
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: <Widget>[
                              subheading('Informações'),
                            ],
                          ),
                          SizedBox(height: 15.0),
                          TaskColumn(
                            icon: Icons.alarm,
                            iconBackgroundColor: LightColors.kBlue,
                            title: 'Rega',
                            subtitle:  (widget.dadosPlanta.data()["rega"] == "" ) ? "Adicione Informações de Rega" :widget.dadosPlanta.data()["rega"],
                          ),
                          SizedBox(
                            height: 15.0,
                          ),
                          TaskColumn(
                            icon: Icons.blur_circular,
                            iconBackgroundColor: LightColors.kLightYellow2,
                            title: 'Luminosidade',
                            subtitle: widget.dadosPlanta.data()["luz"] == "" ? "Adicione Informações de Luminosidade" :widget.dadosPlanta.data()["luz"],
                          ),
                          SizedBox(height: 15.0),
                          TaskColumn(
                            icon: Icons.check_circle_outline,
                            iconBackgroundColor: LightColors.kRed,
                            title: 'Adubo',
                            subtitle:  widget.dadosPlanta.data()["adubo"] == "" ? "Adicione Informações de Adubo" :widget.dadosPlanta.data()["adubo"],
                          ),
                        ],
                      ),
                    ),
                    Container(
                        color: Colors.transparent,
                        padding: EdgeInsets.only(
                            left: 20.0, right: 20, bottom: 0, top: 15),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.center,
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: <Widget>[
                            subheading('Linha do Tempo'),
                            GestureDetector(
                              onTap: () {
                                Navigator.push(
                                    context,
                                    MaterialPageRoute(
                                        builder: (context) => AddTimeLine(widget.dadosPlanta)),
                                  );
                              },
                              child: addPlantIcon(),
                            ),
                          ],
                        )),
                    Container(
                      color: Colors.transparent,
                      padding: EdgeInsets.symmetric(
                          horizontal: 10.0, vertical: 10.0),
                      child: StreamBuilder(
                          stream: FirebaseFirestore.instance
                              .collection("timeline")
                              .where("planta", isEqualTo: widget.dadosPlanta.id)
                             // .orderBy("planta")
                              .orderBy("data", descending: true)
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
                                  return
                                     Text(
                                      "Adicione eventos :P",
                                      textAlign: TextAlign.start,
                                      style: TextStyle(
                                          color: LightColors.kGreen,
                                          fontSize: 20),
                                    );
                                }
                                return ListView.builder(
                                  itemCount: snapshot.data.documents.length,
                                    physics: NeverScrollableScrollPhysics(),
                                    shrinkWrap: true,
                                    itemBuilder: (context, index) {
                                      return snapshot.data.documents[index]
                                          .data()["imagem"] != "" ? ActiveProjectsCard(
                                        cardColor: LightColors.kDarkYellow,
                                        tipo: 'timeline/',
                                        planta: snapshot.data.documents[index], //gamb pq nao to passando a planta mas soim timeline
                                        title: snapshot.data.documents[index].data()["data"].toString(),
                                        subtitle: snapshot.data.documents[index].data()["descricao"].toString(),
                                        funcao: (){
                                          showDialog(
                                              context: context,
                                              builder: (BuildContext context){
                                                return AlertDialog(
                                                  title: Text("Atenção!"),
                                                  content: Text("Deseja Excluir?"),
                                                  actions: <Widget>[
                                                    FlatButton(
                                                      child: Text("Cancelar"),
                                                      onPressed: () {
                                                        Navigator.pop(context);
                                                      },
                                                    ),
                                                    FlatButton(
                                                      child: Text("Confirmar"),
                                                      onPressed: () {
                                                        setState((){
                                                          FirebaseFirestore.instance.collection('timeline')
                                                              .doc(snapshot.data.documents[index].id)
                                                              .delete().then((value) => {
                                                            Navigator.pop(context),
                                                          });
                                                        });
                                                      },
                                                    ),
                                                  ],
                                                );
                                              }
                                          );
                                        },
                                      ) :
                                      TaskContainer(
                                        subtitle: snapshot.data.documents[index].data()["descricao"],
                                        title: snapshot.data.documents[index].data()["data"],boxColor: LightColors.kCInza,
                                        funcao: (){
                                          showDialog(
                                              context: context,
                                              builder: (BuildContext context){
                                                return AlertDialog(
                                                  title: Text("Atenção!"),
                                                  content: Text("Deseja Excluir?"),
                                                  actions: <Widget>[
                                                    FlatButton(
                                                      child: Text("Cancelar"),
                                                      onPressed: () {
                                                        Navigator.pop(context);
                                                      },
                                                    ),
                                                    FlatButton(
                                                      child: Text("Confirmar"),
                                                      onPressed: () {
                                                        setState((){
                                                          FirebaseFirestore.instance.collection('timeline')
                                                              .doc(snapshot.data.documents[index].id)
                                                              .delete().then((value) => {
                                                            Navigator.pop(context),
                                                          });
                                                        });
                                                      },
                                                    ),
                                                  ],
                                                );
                                              }
                                          );
                                        },
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
