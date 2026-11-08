import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  AccessibilityInfo,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  SafeAreaProvider,
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import CloudLogo from "./CloudLogo";
import CloudCard3D from "./CloudCard3D";
import HomeScene from "./HomeScene";

const USE_NATIVE_DRIVER = Platform.OS !== "web";
const BUILDING_STORAGE_KEY = "cloudblock.selectedBuilding.v1";
const USER_CARD_STORAGE_KEY = "cloudblock.userCard.v1";
const SERIF = Platform.select({
  ios: "Georgia",
  android: "serif",
  default:
    "Georgia, 'Iowan Old Style', Palatino, 'Palatino Linotype', 'Times New Roman', serif",
});

const SCREEN_VEIL =
  "linear-gradient(to bottom, rgba(6,8,12,0.93) 0%, rgba(6,8,12,0.88) 46%, rgba(6,8,12,0.94) 100%)";
const WINDOW_WASH =
  "radial-gradient(ellipse at center, rgba(255,214,160,0.55) 0%, rgba(214,132,58,0.16) 48%, rgba(8,8,10,0) 76%)";

const DEMO_BUILDINGS = [
  {
    id: "cloudblock",
    name: "CloudBlock Tower",
    address: "88 Cloud Street",
  },
  {
    id: "willow",
    name: "The Willow",
    address: "14 Willow Lane",
  },
  {
    id: "harbor",
    name: "Harbor House",
    address: "260 Harbor Avenue",
  },
];

const neighbors = [
  {
    buildingId: "cloudblock",
    floor: 12,
    name: "Maya Chen",
    apartment: "12A",
    bio: "Always looking for a tennis partner.",
    hobbies: ["Tennis", "Plants", "Pottery"],
    skin: "#C88462",
    shirt: "#E2A56A",
  },
  {
    buildingId: "willow",
    floor: 12,
    name: "Theo Brooks",
    apartment: "12C",
    bio: "Sunday pancakes are kind of my thing.",
    hobbies: ["Cooking", "Jazz", "Running"],
    skin: "#E6B58B",
    shirt: "#7EAEA0",
  },
  {
    buildingId: "cloudblock",
    floor: 9,
    name: "Imani Carter",
    apartment: "9B",
    bio: "New to the block. Say hi anytime.",
    hobbies: ["Cycling", "Books", "Baking"],
    skin: "#754B3E",
    shirt: "#B39BC8",
  },
  {
    buildingId: "harbor",
    floor: 9,
    name: "Leo Alvarez",
    apartment: "9D",
    bio: "I know every good coffee spot nearby.",
    hobbies: ["Coffee", "Music", "Climbing"],
    skin: "#D59A72",
    shirt: "#7F9EBE",
  },
  {
    buildingId: "cloudblock",
    floor: 6,
    name: "Nina Patel",
    apartment: "6A",
    bio: "Happy to trade herbs for good stories.",
    hobbies: ["Gardening", "Yoga", "Art"],
    skin: "#B97652",
    shirt: "#D9929A",
  },
  {
    buildingId: "willow",
    floor: 6,
    name: "Sam Okafor",
    apartment: "6C",
    bio: "Looking for a buddy for morning walks.",
    hobbies: ["Walking", "Chess", "Films"],
    skin: "#5D3C32",
    shirt: "#D2A956",
  },
  {
    buildingId: "cloudblock",
    floor: 3,
    name: "Ellis Morgan",
    apartment: "3B",
    bio: "I make a very enthusiastic book club.",
    hobbies: ["Reading", "Knitting", "Tea"],
    skin: "#F0C39E",
    shirt: "#7C9CB4",
  },
  {
    buildingId: "harbor",
    floor: 3,
    name: "Jules Kim",
    apartment: "3D",
    bio: "Got a spare seat on my weekend hikes.",
    hobbies: ["Hiking", "Photography", "Dogs"],
    skin: "#D29A78",
    shirt: "#8EAA7C",
  },
  {
    buildingId: "cloudblock",
    floor: 1,
    name: "Ari Williams",
    apartment: "1A",
    bio: "A friendly hello makes my whole day.",
    hobbies: ["Board games", "Baking", "Podcasts"],
    skin: "#8C5945",
    shirt: "#C48A6C",
  },
  {
    buildingId: "willow",
    floor: 1,
    name: "Robin Silva",
    apartment: "1C",
    bio: "Looking for neighbors to swap playlists.",
    hobbies: ["Music", "Drawing", "Cooking"],
    skin: "#E0AA82",
    shirt: "#8AA3C4",
  },
];

const communityPosts = [
  {
    id: "flour",
    buildingId: "cloudblock",
    type: "request",
    urgency: "urgent",
    title: "Borrow some flour",
    text: "Can I borrow a cup of flour?",
    unit: "12A",
  },
  {
    id: "plants",
    buildingId: "willow",
    type: "offer",
    urgency: "normal",
    title: "Plant sitting",
    text: "Happy to water your plants this weekend",
    unit: "6A",
  },
  {
    id: "bike",
    buildingId: "harbor",
    type: "offer",
    urgency: "urgent",
    title: "Free bike",
    text: "Giving away a bicycle for free.",
    unit: "9D",
  },
  {
    id: "charger",
    buildingId: "cloudblock",
    type: "request",
    urgency: "normal",
    title: "USB-C charger",
    text: "Anyone have a USB-C charger I can borrow?",
    unit: "3B",
  },
  {
    id: "soup",
    buildingId: "willow",
    type: "offer",
    urgency: "casual",
    title: "Extra soup",
    text: "Extra soup if anyone is feeling cozy.",
    unit: "12C",
  },
  {
    id: "walk",
    buildingId: "harbor",
    type: "request",
    urgency: "casual",
    title: "Walking buddy",
    text: "Looking for a walking buddy.",
    unit: "1A",
  },
  {
    id: "boxes",
    buildingId: "cloudblock",
    type: "request",
    urgency: "urgent",
    title: "Moving boxes",
    text: "Could someone lend me two moving boxes?",
    unit: "6C",
  },
  {
    id: "books",
    buildingId: "willow",
    type: "offer",
    urgency: "normal",
    title: "Free books",
    text: "Free books. Come pick your favorites.",
    unit: "3D",
  },
];

function Fill({ image, style }) {
  return (
    <View pointerEvents="none" style={[style, { backgroundImage: image }]} />
  );
}

function SuccessState({ message }) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(progress, {
      toValue: 1,
      damping: 17,
      stiffness: 150,
      mass: 0.8,
      useNativeDriver: USE_NATIVE_DRIVER,
    }).start();
  }, [progress]);

  const scale = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.94, 1],
  });

  return (
    <Animated.View
      accessibilityRole="alert"
      style={[
        styles.successState,
        { opacity: progress, transform: [{ scale }] },
      ]}
    >
      <View style={styles.successCheckCircle}>
        <Text style={styles.successCheck}>✓</Text>
      </View>
      <Text style={styles.successMessage}>{message}</Text>
    </Animated.View>
  );
}

function HomeScreen({
  active,
  userCard,
  onFindBuilding,
  onOpenUserCard,
}) {
  const [logoVisible, setLogoVisible] = useState(true);

  return (
    <View style={styles.screen}>
      <HomeScene active={active} />
      {logoVisible ? (
        <CloudLogo active={active} onComplete={() => setLogoVisible(false)} />
      ) : null}
      <View style={styles.homeActions}>
        <Pressable
          accessibilityRole="button"
          onPress={onFindBuilding}
          style={({ pressed }) => [
            styles.homeActionButton,
            styles.homeActionPrimary,
            pressed && styles.buttonPressed,
          ]}
        >
          <Text style={styles.homeActionPrimaryText}>Find your building</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={onOpenUserCard}
          style={({ pressed }) => [
            styles.homeActionButton,
            styles.homeActionSecondary,
            pressed && styles.buttonPressed,
          ]}
        >
          <Text style={styles.homeActionSecondaryText}>
            {userCard ? "My Window" : "Create your Window"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function PageHeader({ kicker, title, building }) {
  return (
    <View style={styles.pageHeader}>
      {kicker ? <Text style={styles.pageKicker}>{kicker}</Text> : null}
      <View style={styles.pageHeaderRow}>
        <Text style={styles.pageTitle}>{title}</Text>
        <Text style={styles.pageMark}>CB</Text>
      </View>
      {building ? (
        <Text numberOfLines={1} style={styles.pageBuilding}>
          {building.name}
          {building.address ? `  ·  ${building.address}` : ""}
        </Text>
      ) : null}
    </View>
  );
}

function CloudMatesCard({ count }) {
  return (
    <View style={styles.matesSummary}>
      <View style={styles.matesCount}>
        <Text style={styles.matesCountNumber}>{count}</Text>
        <Text style={styles.matesMeta}>
          {count === 1 ? "neighbor" : "neighbors"}
        </Text>
      </View>
    </View>
  );
}

function CloudAvatar() {
  return (
    <View style={styles.cloudAvatar}>
      <View style={[styles.avatarPuff, styles.avatarPuffLeft]} />
      <View style={[styles.avatarPuff, styles.avatarPuffCenter]} />
      <View style={[styles.avatarPuff, styles.avatarPuffRight]} />
      <View style={styles.avatarFace}>
        <View style={styles.avatarEyes}>
          <View style={styles.avatarEye} />
          <View style={styles.avatarEye} />
        </View>
        <View style={styles.avatarSmile} />
      </View>
    </View>
  );
}

function NeighborWindow({
  neighbor,
  index,
  onTogglePrivacy,
  privacyError,
}) {
  const entrance = useRef(new Animated.Value(0)).current;
  const [sent, setSent] = useState(false);
  const blinds = useRef(
    new Animated.Value(neighbor.privacyMode ? 0 : 1),
  ).current;

  useEffect(() => {
    const animation = Animated.spring(entrance, {
      toValue: 1,
      delay: index * 70,
      friction: 8,
      tension: 54,
      useNativeDriver: USE_NATIVE_DRIVER,
    });
    animation.start();
    return () => animation.stop();
  }, [entrance, index]);

  useEffect(() => {
    Animated.spring(blinds, {
      toValue: neighbor.privacyMode ? 0 : 1,
      damping: 18,
      stiffness: 130,
      mass: 0.8,
      useNativeDriver: USE_NATIVE_DRIVER,
    }).start();
  }, [blinds, neighbor.privacyMode]);

  const translateY = entrance.interpolate({
    inputRange: [0, 1],
    outputRange: [22, 0],
  });
  const blindOffset = blinds.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -168],
  });

  return (
    <Animated.View
      style={[
        styles.neighborCard,
        { opacity: entrance, transform: [{ translateY }] },
      ]}
    >
      <View style={styles.windowFrame}>
        <View style={styles.windowLight} />
        <Text
          accessible={!neighbor.privacyMode}
          accessibilityElementsHidden={neighbor.privacyMode}
          importantForAccessibility={
            neighbor.privacyMode ? "no-hide-descendants" : "auto"
          }
          style={[
            styles.windowUnit,
            neighbor.privacyMode && styles.privateProfileText,
          ]}
        >
          APT {neighbor.privacyMode ? "**" : neighbor.apartment}
        </Text>
        {neighbor.privacyMode ? (
          <Text style={styles.privateBadge}>PRIVATE</Text>
        ) : null}
        <CloudAvatar />
        {neighbor.privacyMode ? (
          <Animated.View
            style={[
              styles.blindPanel,
              { transform: [{ translateY: blindOffset }] },
            ]}
          >
            {Array.from({ length: 8 }, (_, slat) => (
              <View key={slat} style={styles.blindSlat} />
            ))}
          </Animated.View>
        ) : null}
      </View>
      <Text
        accessible={!neighbor.privacyMode}
        accessibilityElementsHidden={neighbor.privacyMode}
        importantForAccessibility={
          neighbor.privacyMode ? "no-hide-descendants" : "auto"
        }
        style={[
          styles.neighborName,
          neighbor.privacyMode && styles.privateProfileText,
        ]}
      >
        {neighbor.privacyMode ? "**" : neighbor.name}
      </Text>
      <Text
        accessible={!neighbor.privacyMode}
        accessibilityElementsHidden={neighbor.privacyMode}
        importantForAccessibility={
          neighbor.privacyMode ? "no-hide-descendants" : "auto"
        }
        style={[
          styles.neighborBio,
          neighbor.privacyMode && styles.privateProfileText,
        ]}
      >
        {neighbor.privacyMode ? "**" : neighbor.bio}
      </Text>
      <Text
        accessible={!neighbor.privacyMode}
        accessibilityElementsHidden={neighbor.privacyMode}
        importantForAccessibility={
          neighbor.privacyMode ? "no-hide-descendants" : "auto"
        }
        style={[
          styles.neighborHobbies,
          neighbor.privacyMode && styles.privateProfileText,
        ]}
      >
        {neighbor.privacyMode ? "**" : neighbor.hobbies.join("   ·   ")}
      </Text>
      {neighbor.isCurrentUser ? (
        <>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: neighbor.privacyMode }}
            onPress={onTogglePrivacy}
            style={[
              styles.helloButton,
              neighbor.privacyMode && styles.helloButtonSent,
            ]}
          >
            <Text
              style={[
                styles.helloText,
                neighbor.privacyMode && styles.helloTextSent,
              ]}
            >
              {neighbor.privacyMode ? "Privacy mode on" : "Go private"}
            </Text>
          </Pressable>
          {privacyError ? (
            <Text accessibilityRole="alert" style={styles.pickerError}>
              {privacyError}
            </Text>
          ) : null}
        </>
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: sent }}
          onPress={() => setSent(true)}
          style={[styles.helloButton, sent && styles.helloButtonSent]}
        >
          <Text style={[styles.helloText, sent && styles.helloTextSent]}>
            {sent ? "Hello sent" : "Say hello"}
          </Text>
        </Pressable>
      )}
    </Animated.View>
  );
}

function ConnectScreen({
  building,
  userCard,
  onTogglePrivacy,
  privacyError,
}) {
  const buildingNeighbors = useMemo(() => neighbors.filter(
    (neighbor) => neighbor.buildingId === building.id,
  ), [building.id]);
  const profiles = useMemo(() => {
    const currentUser = userCard
      ? {
        ...userCard,
        buildingId: building.id,
        floor: Number.parseInt(userCard.apartment, 10) || 1,
        isCurrentUser: true,
        skin: "#D9AA86",
        shirt: "#98A9B2",
        hobbies: ["Your CloudBlock window"],
      }
      : null;
    return currentUser ? [...buildingNeighbors, currentUser] : buildingNeighbors;
  }, [building.id, buildingNeighbors, userCard]);
  const floors = [...new Set(profiles.map((neighbor) => neighbor.floor))].sort(
    (first, second) => second - first,
  );
  return (
    <View style={styles.screen}>
      <PageHeader title="Connect" building={building} />
      <ScrollView
        contentContainerStyle={styles.connectContent}
        showsVerticalScrollIndicator={false}
      >
        <CloudMatesCard count={buildingNeighbors.length} />
        {profiles.length === 0 ? (
          <View style={styles.emptyPanel}>
            <Text style={styles.emptyTitle}>No neighbors yet</Text>
          </View>
        ) : (
          floors.map((floor) => {
            const floorNeighbors = profiles.filter(
              (neighbor) => neighbor.floor === floor,
            );
            return (
              <View key={floor} style={styles.floorSection}>
                <View style={styles.floorHeading}>
                  <Text style={styles.floorIndex}>
                    {String(floor).padStart(2, "0")}
                  </Text>
                  <View style={styles.floorRule} />
                  <Text style={styles.floorCount}>
                    {floorNeighbors.length}{" "}
                    {floorNeighbors.length === 1 ? "neighbor" : "neighbors"}
                  </Text>
                </View>
                <ScrollView
                  horizontal
                  contentContainerStyle={styles.neighborCarousel}
                  decelerationRate="fast"
                  showsHorizontalScrollIndicator={false}
                  snapToInterval={276}
                >
                  {floorNeighbors.map((neighbor, index) => (
                    <NeighborWindow
                      key={`${neighbor.isCurrentUser ? "you" : "neighbor"}-${neighbor.apartment}`}
                      neighbor={neighbor}
                      index={index}
                      onTogglePrivacy={
                        neighbor.isCurrentUser ? onTogglePrivacy : undefined
                      }
                      privacyError={
                        neighbor.isCurrentUser ? privacyError : ""
                      }
                    />
                  ))}
                </ScrollView>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

function FloatingNote({ post, index, reducedMotion }) {
  const entrance = useRef(new Animated.Value(0)).current;
  const hover = useRef(new Animated.Value(0)).current;
  const [expanded, setExpanded] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const intro = Animated.spring(entrance, {
      toValue: 1,
      delay: index * 80,
      friction: 8,
      tension: 48,
      useNativeDriver: USE_NATIVE_DRIVER,
    });
    intro.start();
    if (!reducedMotion) {
      const float = Animated.loop(
        Animated.sequence([
          Animated.timing(hover, {
            toValue: 1,
            duration: 3400 + index * 240,
            useNativeDriver: USE_NATIVE_DRIVER,
          }),
          Animated.timing(hover, {
            toValue: 0,
            duration: 3400 + index * 240,
            useNativeDriver: USE_NATIVE_DRIVER,
          }),
        ]),
      );
      float.start();
      return () => {
        intro.stop();
        float.stop();
      };
    }
    return () => {
      intro.stop();
    };
  }, [entrance, hover, index, reducedMotion]);

  const introY = entrance.interpolate({
    inputRange: [0, 1],
    outputRange: [26, 0],
  });
  const floatY = hover.interpolate({
    inputRange: [0, 1],
    outputRange: [0, index % 2 === 0 ? -7 : 7],
  });
  const toggleExpanded = () => setExpanded((value) => !value);

  return (
    <Animated.View
      style={[
        styles.noteFloat,
        {
          opacity: entrance,
          transform: [
            { translateY: Animated.add(introY, floatY) },
          ],
        },
      ]}
    >
      <View style={styles.noteSurface}>
        <CloudCard3D
          title={post.title}
          description={post.text}
          type={post.type}
          reducedMotion={reducedMotion}
          onPress={toggleExpanded}
          accessibilityLabel={`${post.type} from apartment ${post.unit}: ${post.title}`}
          accessibilityHint={expanded ? "Collapse details" : "Expand details"}
        />
        <View style={styles.noteOverlay} pointerEvents="none">
          <View style={styles.noteMeta}>
            <Text style={[styles.noteType, post.type === "offer" && styles.noteTypeCool]}>
              {post.type === "request" ? "REQUEST" : "OFFER"}
            </Text>
            <Text style={styles.noteUnit}>APT {post.unit}</Text>
          </View>
          <Text numberOfLines={expanded ? 3 : 2} style={styles.noteText}>
            {post.title}
          </Text>
          <Text numberOfLines={expanded ? 3 : 2} style={styles.noteDescription}>
            {post.text}
          </Text>
        </View>
        {expanded ? (
          <View style={styles.noteDetails}>
            <Text style={styles.noteDetailsText}>
              {post.urgency === "urgent" ? "Urgent" : post.type === "offer" ? "Available to neighbors" : "From a neighbor"}
            </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={saved ? "Remove saved post" : "Save post"}
            accessibilityState={{ selected: saved }}
            onPress={() => setSaved((value) => !value)}
            style={styles.noteSaveButton}
          >
            <Text style={styles.noteSaveText}>{saved ? "Saved" : "Save"}</Text>
          </Pressable>
          </View>
        ) : null}
      </View>
    </Animated.View>
  );
}

function ContributeScreen({ building, reducedMotion }) {
  const [filter, setFilter] = useState("request");
  const [search, setSearch] = useState("");
  const buildingPosts = communityPosts.filter(
    (post) => post.buildingId === building.id,
  );
  const counts = {
    request: buildingPosts.filter((post) => post.type === "request").length,
    offer: buildingPosts.filter((post) => post.type === "offer").length,
  };
  const visiblePosts = buildingPosts.filter((post) => {
    const matchesType = post.type === filter;
    const query = search.trim().toLowerCase();
    return (
      matchesType &&
      (!query ||
        post.text.toLowerCase().includes(query) ||
        post.unit.toLowerCase().includes(query))
    );
  });

  return (
    <View style={styles.screen}>
      <PageHeader title="Contribute" building={building} />
      <View accessibilityRole="tablist" style={styles.boardTabs}>
        {[
          { key: "request", label: "Requests" },
          { key: "offer", label: "Offers" },
        ].map((tab) => {
          const selected = filter === tab.key;
          return (
            <Pressable
              key={tab.key}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              onPress={() => setFilter(tab.key)}
              style={[styles.boardTab, selected && styles.boardTabSelected]}
            >
              <Text
                style={[styles.boardTabText, selected && styles.boardTabTextSelected]}
              >
                {tab.label}
              </Text>
              <Text
                style={[styles.boardTabCount, selected && styles.boardTabTextSelected]}
              >
                {counts[tab.key]}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <ScrollView
        contentContainerStyle={styles.boardScroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {visiblePosts.length ? (
          visiblePosts.map((post, index) => (
            <FloatingNote
              key={post.id}
              post={post}
              index={index}
              reducedMotion={reducedMotion}
            />
          ))
        ) : (
          <View style={styles.emptyPanel}>
            <Text style={styles.emptyTitle}>
              {buildingPosts.length ? "Nothing matches" : "Clear skies"}
            </Text>
            <Text style={styles.emptyText}>
              {buildingPosts.length
                ? "Try another search."
                : "Nothing here yet."}
            </Text>
          </View>
        )}
      </ScrollView>
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>⌕</Text>
        <TextInput
          accessibilityLabel="Search community board"
          autoCapitalize="none"
          keyboardAppearance="dark"
          onChangeText={setSearch}
          placeholder={`Search ${filter === "request" ? "requests" : "offers"}`}
          placeholderTextColor="#8E8A84"
          returnKeyType="search"
          style={styles.searchInput}
          value={search}
        />
        {search ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Clear search"
            onPress={() => setSearch("")}
            style={styles.clearSearch}
          >
            <Text style={styles.clearSearchText}>×</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function BuildingPicker({
  visible,
  error,
  saving,
  joined,
  onEnter,
}) {
  const [query, setQuery] = useState("");
  const [selection, setSelection] = useState(null);
  const normalizedQuery = query.trim().toLowerCase();
  const suggestions = DEMO_BUILDINGS.filter((building) =>
    `${building.name} ${building.address}`.toLowerCase().includes(normalizedQuery),
  );
  const isExactSuggestion = DEMO_BUILDINGS.some(
    (building) =>
      building.name.toLowerCase() === normalizedQuery ||
      building.address.toLowerCase() === normalizedQuery,
  );

  useEffect(() => {
    if (!visible) return;
    setQuery("");
    setSelection(null);
  }, [visible]);

  if (!visible) return null;

  function selectCustomAddress() {
    const address = query.trim();
    if (!address) return;
    const id = address.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    setSelection({
      id: `custom-${id}`,
      name: address,
      address,
    });
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.pickerOverlay}
    >
      <View style={styles.pickerScrim} />
      <View style={styles.pickerCenter}>
        <View style={styles.pickerCard}>
          {joined ? (
            <SuccessState message="Joined Building Successfully!" />
          ) : (
            <>
              <Text style={styles.pickerTitle}>Find Your Building</Text>
              <TextInput
            accessibilityLabel="Building name or address"
            autoCapitalize="words"
            autoCorrect={false}
            keyboardAppearance="dark"
            onChangeText={(value) => {
              setQuery(value);
              setSelection(null);
            }}
            placeholder="Building name or address"
            placeholderTextColor="#8E8A84"
            returnKeyType="search"
            style={styles.pickerInput}
            value={query}
              />
              <Text style={styles.suggestionsLabel}>
            {normalizedQuery ? "MATCHING BUILDINGS" : "SUGGESTED"}
              </Text>
              <ScrollView
            keyboardShouldPersistTaps="handled"
            style={styles.suggestionList}
            contentContainerStyle={styles.suggestionListContent}
            showsVerticalScrollIndicator={false}
          >
            {suggestions.map((building) => {
              const isSelected = selection?.id === building.id;
              return (
                <Pressable
                  key={building.id}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: isSelected }}
                  onPress={() => setSelection(building)}
                  style={[
                    styles.buildingSuggestion,
                    isSelected && styles.buildingSuggestionSelected,
                  ]}
                >
                  <View style={styles.suggestionCopy}>
                    <Text style={styles.suggestionName}>{building.name}</Text>
                    <Text style={styles.suggestionAddress}>{building.address}</Text>
                  </View>
                  <Text style={styles.suggestionCheck}>{isSelected ? "✓" : "›"}</Text>
                </Pressable>
              );
            })}
            {normalizedQuery && !isExactSuggestion ? (
              <Pressable
                accessibilityRole="radio"
                accessibilityState={{
                  checked: selection?.id.startsWith("custom-") || false,
                }}
                onPress={selectCustomAddress}
                style={[
                  styles.buildingSuggestion,
                  selection?.id.startsWith("custom-") &&
                    styles.buildingSuggestionSelected,
                ]}
              >
                <View style={styles.suggestionCopy}>
                  <Text style={styles.suggestionName}>Use this address</Text>
                  <Text numberOfLines={1} style={styles.suggestionAddress}>
                    {query.trim()}
                  </Text>
                </View>
                <Text style={styles.suggestionCheck}>
                  {selection?.id.startsWith("custom-") ? "✓" : "›"}
                </Text>
              </Pressable>
            ) : null}
              </ScrollView>
              {error ? <Text style={styles.pickerError}>{error}</Text> : null}
              <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: !selection || saving }}
            disabled={!selection || saving}
            onPress={() => onEnter(selection)}
            style={({ pressed }) => [
              styles.enterBuildingButton,
              (!selection || saving) && styles.enterBuildingButtonDisabled,
              pressed && selection && !saving && styles.buttonPressed,
            ]}
              >
                <Text style={styles.enterBuildingText}>
              {saving ? "Saving…" : "Enter building"}
                </Text>
              </Pressable>
            </>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

function UserCardEditor({
  visible,
  building,
  userCard,
  saving,
  error,
  windowAdded,
  onSave,
  onDismiss,
}) {
  const [name, setName] = useState("");
  const [apartment, setApartment] = useState("");
  const [bio, setBio] = useState("");

  useEffect(() => {
    if (!visible) return;
    setName(userCard?.name || "");
    setApartment(userCard?.apartment || "");
    setBio(userCard?.bio || "");
  }, [visible, userCard]);

  if (!visible) return null;

  const canSave = Boolean(name.trim() && apartment.trim() && !saving);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.profileOverlay}
    >
      <View style={styles.pickerScrim} />
      <View style={styles.pickerCenter}>
        <View style={styles.pickerCard}>
          <Text style={styles.pickerTitle}>
            {userCard ? "Your Window" : "Create your Window"}
          </Text>
          {windowAdded ? (
            <SuccessState message="Your Window Added Successfully!" />
          ) : (
            <>
          <TextInput
            accessibilityLabel="Name on your window"
            autoCapitalize="words"
            autoCorrect={false}
            keyboardAppearance="dark"
            onChangeText={setName}
            placeholder="Name"
            placeholderTextColor="#8E8A84"
            returnKeyType="next"
            style={styles.pickerInput}
            value={name}
          />
          <TextInput
            accessibilityLabel="Apartment number"
            autoCapitalize="characters"
            autoCorrect={false}
            keyboardAppearance="dark"
            onChangeText={setApartment}
            placeholder="Apartment (for example, 12A)"
            placeholderTextColor="#8E8A84"
            returnKeyType="next"
            style={styles.profileInput}
            value={apartment}
          />
          <TextInput
            accessibilityLabel="Short profile introduction"
            autoCapitalize="sentences"
            keyboardAppearance="dark"
            onChangeText={setBio}
            placeholder="A little about you (optional)"
            placeholderTextColor="#8E8A84"
            returnKeyType="done"
            style={styles.profileInput}
            value={bio}
          />
          {error ? (
            <Text accessibilityRole="alert" style={styles.pickerError}>
              {error}
            </Text>
          ) : null}
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: !canSave }}
            disabled={!canSave}
            onPress={() =>
              onSave({
                name: name.trim(),
                apartment: apartment.trim(),
                bio: bio.trim() || "A neighbor in this building.",
              })
            }
            style={({ pressed }) => [
              styles.enterBuildingButton,
              !canSave && styles.enterBuildingButtonDisabled,
              pressed && canSave && styles.buttonPressed,
            ]}
          >
            <Text style={styles.enterBuildingText}>
              {saving ? "Saving…" : "Save Window"}
            </Text>
          </Pressable>
            </>
          )}
          <Pressable
            accessibilityRole="button"
            disabled={saving}
            onPress={onDismiss}
            style={styles.profileDismiss}
          >
            <Text style={styles.profileDismissText}>
              {userCard ? "Close" : "Not now"}
            </Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

function TabIcon({ name, color }) {
  if (name === "home") {
    return (
      <View style={[styles.towerIcon, { borderColor: color }]}>
        <View style={[styles.towerAntenna, { backgroundColor: color }]} />
        <View style={styles.towerWindows}>
          {Array.from({ length: 6 }, (_, index) => (
            <View
              key={index}
              style={[styles.towerPane, { backgroundColor: color }]}
            />
          ))}
        </View>
      </View>
    );
  }
  if (name === "connect") {
    return (
      <View style={styles.connectIcon}>
        <View style={[styles.connectOrb, { borderColor: color }]} />
        <View style={[styles.connectOrb, styles.connectOrbOverlap, { borderColor: color }]} />
      </View>
    );
  }
  return (
    <View style={[styles.noteIcon, { borderColor: color }]}>
      <View style={[styles.noteIconLine, { backgroundColor: color }]} />
      <View style={[styles.noteIconLine, { backgroundColor: color }]} />
    </View>
  );
}

function BottomNavigation({ activeTab, onSelect, bottomInset }) {
  const tabs = [
    { key: "home", label: "Home" },
    { key: "connect", label: "Connect" },
    { key: "contribute", label: "Contribute" },
  ];

  return (
    <View
      accessibilityRole="tablist"
      style={[styles.bottomNavigation, { paddingBottom: Math.max(bottomInset, 10) }]}
    >
      {tabs.map((tab) => {
        const selected = activeTab === tab.key;
        const color = selected ? "#F0C27A" : "#8A8680";
        return (
          <Pressable
            key={tab.key}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => onSelect(tab.key)}
            style={styles.navigationTab}
          >
            <TabIcon name={tab.key} color={color} />
            <Text style={[styles.navigationLabel, selected && styles.navigationLabelActive]}>
              {tab.label}
            </Text>
            <View
              style={[
                styles.navigationIndicator,
                selected && styles.navigationIndicatorActive,
              ]}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

function CloudBlockApp() {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const wide = width >= 760 && width > height * 0.9;
  const stageWidth = Math.min(430, Math.max(340, Math.round(height * 0.48)));
  const [activeTab, setActiveTab] = useState("home");
  const [building, setBuilding] = useState(null);
  const [targetTab, setTargetTab] = useState("home");
  const [pickerVisible, setPickerVisible] = useState(false);
  const [userCard, setUserCard] = useState(null);
  const [cardEditorVisible, setCardEditorVisible] = useState(false);
  const [buildingJoined, setBuildingJoined] = useState(false);
  const [windowAdded, setWindowAdded] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [storageReady, setStorageReady] = useState(false);
  const [savingBuilding, setSavingBuilding] = useState(false);
  const [savingUserCard, setSavingUserCard] = useState(false);
  const [storageError, setStorageError] = useState("");
  const [userCardError, setUserCardError] = useState("");

  useEffect(() => {
    let active = true;
    let mediaQuery;
    let subscription;
    const updatePreference = (value) => {
      if (active) setReducedMotion(Boolean(value));
    };

    if (Platform.OS === "web" && typeof window !== "undefined") {
      mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      updatePreference(mediaQuery.matches);
      const handleChange = (event) => updatePreference(event.matches);
      mediaQuery.addEventListener?.("change", handleChange);
      return () => {
        active = false;
        mediaQuery.removeEventListener?.("change", handleChange);
      };
    }

    AccessibilityInfo.isReduceMotionEnabled()
      .then(updatePreference)
      .catch((error) =>
        console.warn("Could not read the reduced-motion preference.", error),
      );
    subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      updatePreference,
    );
    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function restoreBuilding() {
      let restoredBuilding = null;
      try {
        const saved = await AsyncStorage.getItem(BUILDING_STORAGE_KEY);
        if (!active) return;
        if (saved === null) {
          setPickerVisible(true);
        } else {
          const value = JSON.parse(saved);
          if (
            !value ||
            typeof value.id !== "string" ||
            typeof value.name !== "string" ||
            typeof value.address !== "string"
          ) {
            throw new Error("Saved building data is invalid.");
          }
          restoredBuilding = value;
          setBuilding(value);
        }
      } catch (error) {
        console.error("Could not restore the selected building.", error);
        if (active) {
          setBuilding(null);
          setPickerVisible(true);
          setStorageError(
            "We couldn't load the saved building. Choose it again to continue.",
          );
        }
      }

      if (!active) return;
      try {
        const savedCard = await AsyncStorage.getItem(USER_CARD_STORAGE_KEY);
        if (!active) return;
        if (savedCard !== null) {
          const card = JSON.parse(savedCard);
          if (
            !card ||
            typeof card.name !== "string" ||
            typeof card.apartment !== "string" ||
            typeof card.bio !== "string" ||
            typeof card.privacyMode !== "boolean"
          ) {
            throw new Error("Saved user card data is invalid.");
          }
          setUserCard(card);
        } else if (restoredBuilding) {
          setCardEditorVisible(true);
        }
      } catch (error) {
        console.error("Could not restore the user card.", error);
        if (active) {
          setUserCardError(
            "We couldn't load your saved window. You can create it again.",
          );
          if (restoredBuilding) setCardEditorVisible(true);
        }
      } finally {
        if (active) setStorageReady(true);
      }
    }

    restoreBuilding();
    return () => {
      active = false;
    };
  }, []);

  function selectTab(tab) {
    if (tab !== "home" && !building) {
      setTargetTab(tab);
      setPickerVisible(true);
      return;
    }
    setActiveTab(tab);
  }

  function openBuildingPicker() {
    setTargetTab("home");
    setBuildingJoined(false);
    setPickerVisible(true);
  }

  function openUserCardEditor() {
    setUserCardError("");
    setWindowAdded(false);
    if (!building) {
      setTargetTab("home");
      setPickerVisible(true);
      return;
    }
    setCardEditorVisible(true);
  }

  async function enterBuilding(selection) {
    if (!selection || savingBuilding) return;
    setSavingBuilding(true);
    setStorageError("");
    try {
      await AsyncStorage.setItem(
        BUILDING_STORAGE_KEY,
        JSON.stringify(selection),
      );
      setBuilding(selection);
      setActiveTab(targetTab);
      setBuildingJoined(true);
      setTimeout(() => {
        setPickerVisible(false);
        if (!userCard) {
          setUserCardError("");
          setCardEditorVisible(true);
        }
      }, 1200);
    } catch (error) {
      console.error("Could not save the selected building.", error);
      setStorageError(
        "We couldn't save that building. Check device storage and try again.",
      );
    } finally {
      setSavingBuilding(false);
    }
  }

  async function saveUserCard(card) {
    if (savingUserCard) return;
    setSavingUserCard(true);
    setUserCardError("");
    const savedCard = { ...card, privacyMode: userCard?.privacyMode || false };
    try {
      await AsyncStorage.setItem(
        USER_CARD_STORAGE_KEY,
        JSON.stringify(savedCard),
      );
      setUserCard(savedCard);
      setWindowAdded(true);
      setTimeout(() => {
        setCardEditorVisible(false);
        setWindowAdded(false);
      }, 1200);
    } catch (error) {
      console.error("Could not save the user card.", error);
      setUserCardError(
        "We couldn't save your window. Check device storage and try again.",
      );
    } finally {
      setSavingUserCard(false);
    }
  }

  async function toggleUserPrivacy() {
    if (!userCard) return;
    const nextCard = { ...userCard, privacyMode: !userCard.privacyMode };
    setUserCardError("");
    try {
      await AsyncStorage.setItem(
        USER_CARD_STORAGE_KEY,
        JSON.stringify(nextCard),
      );
      setUserCard(nextCard);
    } catch (error) {
      console.error("Could not update user privacy mode.", error);
      setUserCardError(
        "We couldn't update privacy mode. Check device storage and try again.",
      );
    }
  }

  return (
    <View style={styles.app}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent={Platform.OS === "android"}
      />
      <View style={[styles.stage, wide && { width: stageWidth }, wide && styles.stageWide]}>
        <View style={styles.backdrop}>
          {activeTab !== "home" ? (
            <Fill image={SCREEN_VEIL} style={StyleSheet.absoluteFill} />
          ) : null}
        </View>

        <SafeAreaView edges={["top", "left", "right"]} style={styles.safeArea}>
          <View style={styles.appContent}>
            <View style={styles.tabContent}>
              <View
                accessibilityElementsHidden={activeTab !== "home"}
                importantForAccessibility={
                  activeTab === "home" ? "auto" : "no-hide-descendants"
                }
                pointerEvents={activeTab === "home" ? "auto" : "none"}
                style={[styles.layer, activeTab !== "home" && styles.layerOff]}
              >
                <HomeScreen
                  active={
                    activeTab === "home" &&
                    !pickerVisible &&
                    !cardEditorVisible
                  }
                  userCard={userCard}
                  onFindBuilding={openBuildingPicker}
                  onOpenUserCard={openUserCardEditor}
                />
              </View>
              {activeTab === "connect" && building ? (
                <View style={styles.layer}>
                  <ConnectScreen
                    building={building}
                    userCard={userCard}
                    onTogglePrivacy={toggleUserPrivacy}
                    privacyError={userCardError}
                  />
                </View>
              ) : null}
              {activeTab === "contribute" && building ? (
                <View style={styles.layer}>
                  <ContributeScreen
                    building={building}
                    reducedMotion={reducedMotion}
                  />
                </View>
              ) : null}
            </View>
            <BottomNavigation
              activeTab={activeTab}
              onSelect={selectTab}
              bottomInset={insets.bottom}
            />
          </View>
        </SafeAreaView>

        {!storageReady ? (
          <View style={styles.loadingOverlay}>
            <Text style={styles.loadingBrand}>CLOUDBLOCK</Text>
          </View>
        ) : null}
        <BuildingPicker
          visible={storageReady && pickerVisible}
          error={storageError}
          saving={savingBuilding}
          joined={buildingJoined}
          onEnter={enterBuilding}
        />
        <UserCardEditor
          visible={storageReady && cardEditorVisible}
          userCard={userCard}
          saving={savingUserCard}
          error={userCardError}
          windowAdded={windowAdded}
          onSave={saveUserCard}
          onDismiss={() => setCardEditorVisible(false)}
        />
      </View>
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <CloudBlockApp />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  app: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#05070A",
  },
  stage: {
    flex: 1,
    width: "100%",
    overflow: "hidden",
    backgroundColor: "#05070A",
  },
  stageWide: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: "rgba(246, 241, 232, 0.08)",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
    backgroundColor: "#05070A",
  },
  safeArea: {
    flex: 1,
    backgroundColor: "transparent",
  },
  appContent: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
  },
  layer: {
    ...StyleSheet.absoluteFillObject,
  },
  layerOff: {
    opacity: 0,
  },
  screen: {
    flex: 1,
    backgroundColor: "transparent",
  },
  homeActions: {
    position: "absolute",
    left: 18,
    right: 18,
    bottom: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  homeActionButton: {
    minHeight: 46,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
  },
  homeActionPrimary: {
    flex: 1,
    borderWidth: 1,
    borderColor: "rgba(255, 239, 218, 0.62)",
    backgroundColor: "rgba(236, 199, 148, 0.92)",
  },
  homeActionPrimaryText: {
    color: "#1C140C",
    fontSize: 14,
    fontWeight: "600",
  },
  homeActionSecondary: {
    borderWidth: 1,
    borderColor: "rgba(246, 241, 232, 0.28)",
    backgroundColor: "rgba(12, 14, 18, 0.66)",
  },
  homeActionSecondaryText: {
    color: "#F6F1E8",
    fontSize: 13,
    fontWeight: "500",
  },
  pageHeader: {
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 6,
  },
  pageKicker: {
    color: "#E8B56A",
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 2.4,
  },
  pageHeaderRow: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
  },
  pageTitle: {
    color: "#F6F1E8",
    fontFamily: "serif",
    fontSize: 32,
    fontWeight: "700",
    letterSpacing: -0.6,
  },
  pageMark: {
    color: "rgba(232, 181, 106, 0.8)",
    fontFamily: SERIF,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.4,
  },
  pageBuilding: {
    marginTop: 4,
    color: "#A7A29A",
    fontSize: 12,
  },
  connectContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
  },
  matesSummary: {
    minHeight: 50,
    marginBottom: 18,
    paddingHorizontal: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  matesKicker: {
    color: "#B9C9D3",
    fontSize: 9,
    fontWeight: "600",
    letterSpacing: 1.8,
  },
  matesSummaryLabel: {
    marginTop: 4,
    color: "#8F999F",
    fontSize: 11,
  },
  matesCount: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 5,
  },
  matesCountNumber: {
    color: "#F0C27A",
    fontSize: 17,
    fontWeight: "600",
  },
  matesMeta: {
    color: "#9C978F",
    fontSize: 11,
    letterSpacing: 0.4,
  },
  floorSection: {
    marginBottom: 22,
  },
  floorHeading: {
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  floorIndex: {
    color: "#F0C27A",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1.4,
  },
  floorRule: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(246, 241, 232, 0.14)",
  },
  floorCount: {
    color: "#8E8A84",
    fontSize: 11,
  },
  neighborCarousel: {
    paddingRight: 8,
  },
  neighborCard: {
    width: 262,
    marginRight: 14,
    padding: 14,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(246, 241, 232, 0.12)",
    backgroundColor: "rgba(10, 12, 16, 0.78)",
  },
  windowFrame: {
    height: 168,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "flex-end",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(232, 181, 106, 0.38)",
    backgroundColor: "#14110E",
  },
  windowLight: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(235, 192, 132, 0.08)",
  },
  blindPanel: {
    width: "100%",
    height: 168,
    paddingTop: 4,
    alignItems: "center",
    justifyContent: "space-around",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(244, 224, 193, 0.28)",
    backgroundColor: "rgba(21, 24, 28, 0.94)",
  },
  blindSlat: {
    width: "100%",
    height: 7,
    borderRadius: 2,
    backgroundColor: "rgba(192, 180, 160, 0.82)",
    shadowColor: "#EBC994",
    shadowOpacity: 0.16,
    shadowRadius: 3,
    elevation: 1,
  },
  windowUnit: {
    position: "absolute",
    top: 10,
    left: 12,
    color: "#F0C27A",
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 1.1,
  },
  privateBadge: {
    position: "absolute",
    top: 9,
    right: 10,
    paddingHorizontal: 7,
    paddingVertical: 4,
    overflow: "hidden",
    borderRadius: 999,
    backgroundColor: "rgba(13, 17, 22, 0.72)",
    color: "#D7E0E6",
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  cloudAvatar: {
    width: 114,
    height: 90,
    marginBottom: 8,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  avatarPuff: {
    position: "absolute",
    borderRadius: 999,
    backgroundColor: "#F5F8FA",
    shadowColor: "#FFFFFF",
    shadowOpacity: 0.3,
    shadowRadius: 7,
    elevation: 3,
  },
  avatarPuffLeft: {
    left: 10,
    bottom: 8,
    width: 48,
    height: 48,
  },
  avatarPuffCenter: {
    left: 34,
    bottom: 20,
    width: 50,
    height: 56,
  },
  avatarPuffRight: {
    right: 8,
    bottom: 8,
    width: 48,
    height: 48,
  },
  avatarFace: {
    position: "absolute",
    bottom: 19,
    width: 40,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarEyes: {
    width: 20,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  avatarEye: {
    width: 3,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#45545F",
  },
  avatarSmile: {
    width: 9,
    height: 5,
    marginTop: 4,
    borderBottomWidth: 1.5,
    borderColor: "#45545F",
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  neighborName: {
    marginTop: 14,
    color: "#F6F1E8",
    fontFamily: SERIF,
    fontSize: 22,
    fontWeight: "400",
  },
  neighborBio: {
    minHeight: 36,
    marginTop: 6,
    color: "#C5C0B7",
    fontSize: 13,
    lineHeight: 18,
  },
  neighborHobbies: {
    marginTop: 10,
    color: "#A39E96",
    fontSize: 11,
    letterSpacing: 0.2,
  },
  privateProfileText: {
    color: "#D8E0E5",
    letterSpacing: 1,
  },
  helloButton: {
    marginTop: 14,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(232, 181, 106, 0.4)",
  },
  helloButtonSent: {
    backgroundColor: "rgba(232, 181, 106, 0.16)",
  },
  helloText: {
    color: "#E8B56A",
    fontSize: 13,
    fontWeight: "500",
  },
  helloTextSent: {
    color: "#F6F1E8",
  },
  emptyPanel: {
    marginTop: 8,
    paddingHorizontal: 18,
    paddingVertical: 28,
    alignItems: "center",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(246, 241, 232, 0.1)",
    backgroundColor: "rgba(8, 10, 14, 0.55)",
  },
  emptyTitle: {
    color: "#F6F1E8",
    fontFamily: SERIF,
    fontSize: 22,
    fontWeight: "400",
  },
  emptyText: {
    maxWidth: 260,
    marginTop: 8,
    color: "#A7A29A",
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
  },
  boardLead: {
    paddingHorizontal: 24,
    paddingBottom: 14,
    color: "#B7B2AA",
    fontSize: 14,
    lineHeight: 20,
  },
  boardTabs: {
    marginHorizontal: 24,
    marginBottom: 8,
    flexDirection: "row",
    gap: 8,
  },
  boardTab: {
    flex: 1,
    minHeight: 42,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(246, 241, 232, 0.1)",
    backgroundColor: "rgba(8, 10, 14, 0.45)",
  },
  boardTabSelected: {
    borderColor: "rgba(232, 181, 106, 0.55)",
    backgroundColor: "rgba(232, 181, 106, 0.12)",
  },
  boardTabText: {
    color: "#9C978F",
    fontSize: 13,
    fontWeight: "500",
  },
  boardTabCount: {
    color: "#8E8A84",
    fontSize: 12,
  },
  boardTabTextSelected: {
    color: "#F0C27A",
  },
  boardScroll: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    gap: 16,
  },
  noteFloat: {
    overflow: "visible",
  },
  noteSurface: {
    position: "relative",
    width: "100%",
    maxWidth: 430,
    minHeight: 184,
    paddingHorizontal: 12,
    paddingTop: 40,
    paddingBottom: 18,
    alignSelf: "center",
    overflow: "visible",
    backgroundColor: "transparent",
  },
  noteOverlay: {
    zIndex: 1,
    width: "78%",
    maxWidth: 270,
    alignSelf: "center",
  },
  noteDescription: {
    marginTop: 5,
    color: "#52616A",
    fontSize: 11,
    lineHeight: 15,
    textAlign: "center",
  },
  noteCloud: {
    position: "absolute",
    top: 20,
    right: 8,
    bottom: 0,
    left: 8,
    borderRadius: 40,
    borderWidth: 1,
    shadowColor: "#15212A",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 7,
  },
  noteCloudRequest: {
    borderColor: "#FFFFFF",
    backgroundColor: "#F6F8FA",
  },
  noteCloudOffer: {
    borderColor: "#FFFFFF",
    backgroundColor: "#F1F6F9",
  },
  noteContent: {
    zIndex: 1,
    paddingBottom: 1,
  },
  notePressable: {
    zIndex: 1,
  },
  cloudPuff: {
    position: "absolute",
    borderRadius: 999,
    backgroundColor: "#F8FAFC",
  },
  cloudPuffLeft: {
    top: -9,
    left: "12%",
    width: 62,
    height: 40,
  },
  cloudPuffCenter: {
    top: -20,
    left: "37%",
    width: 76,
    height: 52,
  },
  cloudPuffRight: {
    top: -8,
    right: "10%",
    width: 58,
    height: 40,
  },
  noteDetails: {
    zIndex: 1,
    marginTop: 10,
    paddingTop: 10,
    paddingHorizontal: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "rgba(66, 83, 96, 0.14)",
  },
  noteDetailsText: {
    flex: 1,
    paddingRight: 8,
    color: "#5D6A73",
    fontSize: 11,
    lineHeight: 15,
  },
  noteSaveButton: {
    minWidth: 54,
    minHeight: 30,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    backgroundColor: "rgba(48, 68, 82, 0.1)",
  },
  noteSaveText: {
    color: "#3D505D",
    fontSize: 11,
    fontWeight: "600",
  },
  noteMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
  },
  noteTypeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  noteType: {
    color: "#967043",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.6,
  },
  noteTypeCool: {
    color: "#5C7484",
  },
  noteSaved: {
    color: "#547B61",
    fontSize: 8,
    fontWeight: "600",
    letterSpacing: 1.1,
  },
  noteUnit: {
    color: "#64727B",
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.8,
  },
  noteText: {
    marginTop: 7,
    color: "#263742",
    fontFamily: SERIF,
    fontSize: 17,
    lineHeight: 21,
    fontWeight: "600",
    textAlign: "center",
  },
  urgentDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#E8B56A",
  },
  searchBar: {
    minHeight: 48,
    marginHorizontal: 20,
    marginTop: 4,
    marginBottom: 12,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(246, 241, 232, 0.14)",
    backgroundColor: "rgba(8, 10, 14, 0.72)",
  },
  searchIcon: {
    marginRight: 8,
    color: "#E8B56A",
    fontSize: 18,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    color: "#F6F1E8",
    fontSize: 14,
  },
  clearSearch: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  clearSearchText: {
    color: "#C5C0B7",
    fontSize: 20,
  },
  bottomNavigation: {
    paddingTop: 8,
    paddingHorizontal: 8,
    flexDirection: "row",
    alignItems: "stretch",
    justifyContent: "space-around",
    backgroundColor: "rgba(5, 7, 10, 0.78)",
    borderTopWidth: 1,
    borderTopColor: "rgba(232, 181, 106, 0.2)",
  },
  navigationTab: {
    flex: 1,
    minHeight: 52,
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 4,
  },
  navigationLabel: {
    color: "#8A8680",
    fontSize: 10,
    fontWeight: "500",
    letterSpacing: 0.4,
  },
  navigationLabelActive: {
    color: "#F3D7A8",
  },
  navigationIndicator: {
    width: 14,
    height: 2,
    borderRadius: 2,
    backgroundColor: "transparent",
  },
  navigationIndicatorActive: {
    backgroundColor: "#F0C27A",
  },
  towerIcon: {
    width: 15,
    height: 20,
    padding: 2,
    borderWidth: 1.2,
    borderRadius: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  towerAntenna: {
    position: "absolute",
    top: -5,
    left: 6,
    width: 1,
    height: 4,
  },
  towerWindows: {
    width: 8,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 1,
  },
  towerPane: {
    width: 3,
    height: 3,
    borderRadius: 0.5,
  },
  connectIcon: {
    width: 18,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  connectOrb: {
    position: "absolute",
    left: 1,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.4,
  },
  connectOrbOverlap: {
    left: 7,
  },
  noteIcon: {
    width: 13,
    height: 15,
    paddingHorizontal: 2,
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: 2,
  },
  noteIconLine: {
    height: 1,
    marginVertical: 1,
    opacity: 0.9,
  },
  pickerOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20,
  },
  profileOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 21,
  },
  pickerScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(5, 7, 10, 0.24)",
  },
  pickerCenter: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  pickerCard: {
    width: "100%",
    maxWidth: 420,
    maxHeight: "100%",
    alignSelf: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 18,
    overflow: "hidden",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(232, 181, 106, 0.32)",
    backgroundColor: "rgba(12, 13, 16, 0.74)",
  },
  pickerTitle: {
    color: "#F7F1E8",
    fontFamily: SERIF,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "400",
  },
  pickerInput: {
    minHeight: 48,
    marginTop: 16,
    marginBottom: 16,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(246, 241, 232, 0.14)",
    backgroundColor: "rgba(246, 241, 232, 0.04)",
    color: "#F7F1E8",
    fontSize: 15,
  },
  profileSubtitle: {
    marginTop: 6,
    color: "#A7A29A",
    fontSize: 12,
  },
  profileInput: {
    minHeight: 48,
    marginBottom: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(246, 241, 232, 0.14)",
    backgroundColor: "rgba(246, 241, 232, 0.04)",
    color: "#F7F1E8",
    fontSize: 15,
  },
  profileDismiss: {
    minHeight: 40,
    marginTop: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  profileDismissText: {
    color: "#B7B2AA",
    fontSize: 13,
  },
  suggestionsLabel: {
    marginBottom: 8,
    color: "#8E8A84",
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 1.6,
  },
  suggestionList: {
    flexGrow: 0,
    maxHeight: 188,
  },
  suggestionListContent: {
    gap: 8,
  },
  buildingSuggestion: {
    minHeight: 56,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(246, 241, 232, 0.08)",
    backgroundColor: "rgba(246, 241, 232, 0.03)",
  },
  buildingSuggestionSelected: {
    borderColor: "rgba(232, 181, 106, 0.6)",
    backgroundColor: "rgba(232, 181, 106, 0.1)",
  },
  suggestionCopy: {
    flex: 1,
  },
  suggestionName: {
    color: "#F6F1E8",
    fontSize: 14,
    fontWeight: "500",
  },
  suggestionAddress: {
    marginTop: 2,
    color: "#A7A29A",
    fontSize: 12,
  },
  suggestionCheck: {
    marginLeft: 8,
    color: "#E8B56A",
    fontSize: 16,
  },
  pickerError: {
    marginTop: 10,
    color: "#E7A090",
    fontSize: 12,
    lineHeight: 17,
  },
  pickerDisclaimer: {
    marginTop: 12,
    color: "#8E8A84",
    fontSize: 11,
    lineHeight: 16,
  },
  enterBuildingButton: {
    minHeight: 48,
    marginTop: 16,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    backgroundColor: "#E8B56A",
  },
  enterBuildingButtonDisabled: {
    backgroundColor: "rgba(232, 181, 106, 0.28)",
  },
  enterBuildingText: {
    color: "#1C140C",
    fontSize: 15,
    fontWeight: "600",
  },
  buttonPressed: {
    opacity: 0.84,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
    backgroundColor: "rgba(5, 7, 10, 0.18)",
  },
  successState: {
    minHeight: 116,
    paddingHorizontal: 18,
    paddingVertical: 20,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    backgroundColor: "#E5F3E8",
  },
  successCheckCircle: {
    width: 34,
    height: 34,
    marginBottom: 10,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 17,
    backgroundColor: "#B9DCC1",
  },
  successCheck: {
    color: "#245C36",
    fontSize: 20,
    fontWeight: "700",
  },
  successMessage: {
    color: "#245C36",
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
  },
});
